type PromiseFactory<T> = () => Promise<T>;

export class AsyncQueue {
  private concurrency: number; // 最大并发数
  private activeCount: number = 0; // 当前正在运行的任务数
  private waitingQueue: (() => void)[] = []; // 等待队列：存的是一个个用来放行的resolve函数

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  public async add<T>(task: PromiseFactory<T>): Promise<T> {
    // 当前运行任务到达上限，排队
    if (this.activeCount >= this.concurrency) {
      // 阻塞当前执行，只有当内部的resolve被调用，await才会放行
      await new Promise<void>((resolve) => this.waitingQueue.push(resolve));
    }
    this.activeCount++;
    try {
      // 真正执行传入的耗时异步任务
      return await task();
    } finally {
      // 任务执行完毕，释放名额，执行下一个
      this.activeCount--;
      if (this.waitingQueue.length > 0) {
        const next = this.waitingQueue.shift();
        if (next) next();
      }
    }
  }
}
