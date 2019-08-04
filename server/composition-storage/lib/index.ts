import {
  Storage,
  IndexStorage,
  ComponentsStorage,
  Component,
  File,
  Index,
  ComponentTree,
  ComponentGetter,
  Maybe
} from '@dynamico/common-types';

export class CompositionStorage implements Storage {
  constructor(private indexStorage: IndexStorage, private componentsStorage: ComponentsStorage) {}

  getIndex(): Promise<Index> {
    return this.indexStorage.getIndex();
  }
  upsertIndex(index: Index): Promise<void> {
    return this.indexStorage.upsertIndex(index);
  }
  getComponentTree(): Promise<ComponentTree> {
    return this.componentsStorage.getComponentTree();
  }
  getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>> {
    return this.componentsStorage.getComponent(name, version);
  }
  saveComponent(component: Component, files: File[]): Promise<void> {
    return this.componentsStorage.saveComponent(component, files);
  }
}
