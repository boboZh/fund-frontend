import { describe, it, expect } from "vitest";
import { AsyncQueue } from "./AsyncQueue";

describe("AsynQueue并发控制测试", () => {
  it("应该严格限制最大并发数不超过设定值", async () => {
    const MAX_CONCURRENCY = 2;
    const queue = new AsyncQueue(MAX_CONCURRENCY);

    let activeCount = 0;
    let maxActiveCount = 0;

    const mockTask = async () => {
      activeCount++;
      maxActiveCount = Math.max(maxActiveCount, activeCount);
      await new Promise((resolve) => setTimeout(resolve, 50));
      activeCount--;
      return "success";
    };

    const tasks = Array.from({ length: 5 }).map(() => queue.add(mockTask));
    await Promise.all(tasks);

    expect(maxActiveCount).toBeLessThanOrEqual(MAX_CONCURRENCY);
    expect(activeCount).toBe(0);
  });
});
