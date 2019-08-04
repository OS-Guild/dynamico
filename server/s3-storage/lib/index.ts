import { Storage, Component, File, Index, ComponentTree, ComponentGetter, Maybe } from '@dynamico/common-types';
import { S3 } from 'aws-sdk';

export interface Config {
  s3Client: S3;
  bucketName: string;
}

export class S3Storage implements Storage {
  private bucketName: string;
  private s3: S3;
  constructor({ s3Client, bucketName }: Config) {
    this.s3 = s3Client;
    this.bucketName = bucketName;
  }

  async getIndex(): Promise<Index> {
    try {
      const index = await this.s3
        .getObject({
          Bucket: this.bucketName,
          Key: 'index.json'
        })
        .promise();
      if (!index || !index.Body) {
        return {};
      }
      return JSON.parse(index.Body.toString('utf8'));
    } catch (error) {
      if (error.code === 'NoSuchKey') return {};
      throw error;
    }
  }

  async upsertIndex(index: Index) {
    const currentIndex = await this.getIndex();
    await this.s3
      .upload({ Bucket: this.bucketName, Key: 'index.json', Body: JSON.stringify({ ...currentIndex, ...index }) })
      .promise();
  }

  async getComponentTree(): Promise<ComponentTree> {
    const list = await this.s3.listObjectsV2({ Bucket: this.bucketName }).promise();
    if (!list || !list.Contents) {
      return {};
    }
    return list.Contents.filter(o => o && o.Key && o.Key.endsWith('package.json')).reduce(
      (soFar: ComponentTree, current: any) => {
        const [name, componentVersion] = current.Key.split('/');

        return {
          ...soFar,
          [name]: {
            ...soFar[name],
            [componentVersion]: async () => {
              const packageJsonObject = await this.s3
                .getObject({ Bucket: this.bucketName, Key: current.Key })
                .promise();
              if (!packageJsonObject || !packageJsonObject.Body) {
                return;
              }
              return JSON.parse(packageJsonObject.Body.toString('utf8')).peerDependencies;
            }
          }
        };
      },
      {}
    );
  }

  async getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>> {
    const baseKey = `${name.toLowerCase()}/${version}`;
    const params = {
      Bucket: this.bucketName,
      Key: `${baseKey}/package.json`
    };
    const packageJson = await this.s3.getObject(params).promise();
    if (!packageJson || !packageJson.Body) {
      return;
    }
    const { main } = JSON.parse(packageJson.Body.toString());
    return {
      name,
      version,
      getCode: async () => {
        const codeObject = await this.s3.getObject({ ...params, Key: `${baseKey}/${main}` }).promise();
        if (!codeObject || !codeObject.Body) {
          return '';
        }
        return codeObject.Body.toString('utf8');
      }
    };
  }

  async saveComponent(component: Component, files: File[]) {
    if (!files.length) return;
    if (!files.some(f => f.name === 'package.json')) throw new Error('Missing package.json file');
    const baseKey = `${component.name.toLowerCase()}/${component.version}`;
    await Promise.all(
      files.map(f =>
        this.s3
          .upload({
            Bucket: this.bucketName,
            Key: `${baseKey}/${f.name}`,
            Body: f.stream
          })
          .promise()
      )
    );
  }
}
