import { Stream } from 'stream';

export interface Mismatches {
  [dependency: string]: {
    host: string;
    component: string;
  };
}

export type Maybe<T> = T | undefined;

export type Issues<T> = Record<string, Partial<T> & { mismatches: Mismatches }>;

export interface IndexStorage {
  getIndex(): Promise<Index>;
  upsertIndex(index: Index): Promise<void>;
}

export interface ComponentsStorage {
  getComponentTree(): Promise<ComponentTree>;
  getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>>;
  saveComponent(component: Component, files: File[]): Promise<void>;
}

export type Storage = IndexStorage & ComponentsStorage;

export type ComponentVersionMap = Record<Component['name'], Required<Component>['version']>;

export type Index = Record<
  Host['id'],
  {
    dependencies: Dependencies;
    components: ComponentVersionMap;
  }
>;

export type Dependencies = Record<string, string>;

export interface Component {
  name: string;
  version?: string;
}

export type ComponentTree = Record<
  Component['name'],
  Record<ComponentTreeItem['version'], ComponentTreeItem['getDependencies']>
>;

export interface ComponentTreeItem extends Required<Component> {
  getDependencies: () => Promise<Dependencies>;
}

export interface Host {
  id: string;
  dependencies: Dependencies;
}

export interface File {
  name: string;
  stream: Stream;
}

export interface ComponentGetter extends Required<Component> {
  getCode: () => Promise<string>;
}

export interface HostRegistration {
  id: string;
  issues: Issues<Component>;
  index: ComponentVersionMap;
}
