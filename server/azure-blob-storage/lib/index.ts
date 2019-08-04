import { ContainerURL, Aborter, BlockBlobURL, uploadStreamToBlockBlob } from '@azure/storage-blob';
import { Storage, Component, File, Index, ComponentTree, ComponentGetter, Maybe } from '@dynamico/common-types';
import intoStream from 'into-stream';
import { Readable } from 'stream';
import { FailedIndexUpsert } from './errors';

const ONE_MEGABYTE = 1024 * 1024;
const FOUR_MEGABYTES = 4 * ONE_MEGABYTE;

interface AzureBlobStorageOptions {
  container: ContainerURL;
  indexBlobName?: string;
  timeout?: number;
  concurrentConnections?: number;
}

const streamToString = async (readableStream: NodeJS.ReadableStream): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: [string?] = [];
    readableStream.on('data', (data: any) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
};

export class AzureBlobStorage implements Storage {
  private container: ContainerURL;
  private indexBlobUrl: BlockBlobURL;
  private aborter: Aborter;
  private concurrentConnections: number;

  constructor({
    container,
    indexBlobName = 'index.json',
    timeout = 30 * 60000,
    concurrentConnections = 5
  }: AzureBlobStorageOptions) {
    this.container = container;
    this.indexBlobUrl = BlockBlobURL.fromContainerURL(this.container, indexBlobName);
    this.aborter = Aborter.timeout(timeout);
    this.concurrentConnections = concurrentConnections;
  }

  private async downloadBlobAsString(blobUrl: BlockBlobURL): Promise<string> {
    const response = await blobUrl.download(this.aborter, 0);
    if (response.readableStreamBody) {
      return await streamToString(response.readableStreamBody);
    }
    return '';
  }

  async getIndex(): Promise<Index> {
    try {
      return JSON.parse(await this.downloadBlobAsString(this.indexBlobUrl));
    } catch (error) {
      if (error.statusCode === 404) return {};

      throw error;
    }
  }

  async upsertIndex(index: Index) {
    try {
      const currentIndex = await this.getIndex();
      const updatedIndex = JSON.stringify({ ...currentIndex, ...index });
      const indexStream = intoStream(updatedIndex);

      await uploadStreamToBlockBlob(this.aborter, indexStream, this.indexBlobUrl, updatedIndex.length, 10);
    } catch (error) {
      throw new FailedIndexUpsert(error, index);
    }
  }

  async getComponentTree(): Promise<ComponentTree> {
    let listBlobsResult = await this.container.listBlobFlatSegment(this.aborter);

    if (
      !listBlobsResult ||
      !listBlobsResult.segment ||
      !listBlobsResult.segment.blobItems ||
      !listBlobsResult.segment.blobItems.length
    ) {
      return {};
    }

    let blobs = listBlobsResult.segment.blobItems.map(({ name }) => name);

    while (listBlobsResult.nextMarker) {
      listBlobsResult = await this.container.listBlobFlatSegment(this.aborter, listBlobsResult.nextMarker);
      blobs = [...blobs, ...listBlobsResult.segment.blobItems.map(({ name }) => name)];
    }

    return blobs
      .filter(b => b.endsWith('package.json'))
      .reduce((sum: ComponentTree, current: string) => {
        const [name, componentVersion] = current.split('/');

        return {
          ...sum,
          [name]: {
            ...sum[name],
            [componentVersion]: async () => {
              const blobUrl = BlockBlobURL.fromContainerURL(this.container, current);

              return JSON.parse(await this.downloadBlobAsString(blobUrl)).peerDependencies;
            }
          }
        };
      }, {});
  }
  async getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>> {
    const basePath = `${name.toLowerCase()}/${version}`;
    const packageJsonUrl = BlockBlobURL.fromContainerURL(this.container, `${basePath}/package.json`);
    const { main } = JSON.parse(await this.downloadBlobAsString(packageJsonUrl));

    return {
      name,
      version,
      getCode: async () => {
        const codeUrl = BlockBlobURL.fromContainerURL(this.container, `${basePath}/${main}`);

        return await this.downloadBlobAsString(codeUrl);
      }
    };
  }

  async saveComponent(component: Component, files: File[]): Promise<void> {
    if (!files.length) return;

    if (!files.some(f => f.name === 'package.json')) throw new Error('Missing package.json file');

    const basePath = `${component.name}/${component.version}`;

    await Promise.all(
      files.map(f =>
        uploadStreamToBlockBlob(
          this.aborter,
          f.stream as Readable,
          BlockBlobURL.fromContainerURL(this.container, `${basePath}/${f.name}`),
          FOUR_MEGABYTES,
          this.concurrentConnections
        )
      )
    );
  }
}
