export interface DocumentExistsInterface<T> {
  findById(id: string): Promise<T | null>;
}
