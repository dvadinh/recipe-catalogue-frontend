export interface MediaChange {
  file?: File;
  shouldDelete?: boolean;
}

export interface MediaChanges {
  recipe?: MediaChange;
  sections: Map<number, MediaChange>; // positive for existing, negative for new
  steps: Map<number, MediaChange>; // positive for existing, negative for new
}
