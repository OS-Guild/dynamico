import { IndexStorage, Index } from '@dynamico/common-types';
import { RedisClient } from 'redis';
import { promisify } from 'util';

export class RedisIndexStorage implements IndexStorage {
  private saveIndex: (key: string, value: string) => Promise<any>;
  private loadIndex: (key: string) => Promise<string>;
  constructor(redisClient: RedisClient, private indexKeyName = 'index') {
    this.saveIndex = promisify(redisClient.set).bind(redisClient);
    this.loadIndex = promisify(redisClient.get).bind(redisClient);
  }
  async getIndex(): Promise<Index> {
    const index = await this.loadIndex(this.indexKeyName);
    if (!index) {
      return {};
    }
    return JSON.parse(index);
  }

  async upsertIndex(index: Index): Promise<void> {
    return this.saveIndex(this.indexKeyName, JSON.stringify(index));
  }
}
