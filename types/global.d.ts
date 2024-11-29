declare global {
  var fetchSchedules: (() => Promise<void>) | undefined;
}

export {};
