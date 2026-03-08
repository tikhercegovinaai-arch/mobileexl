/**
 * Generic semaphore-based concurrency pool.
 *
 * Runs up to `concurrency` async tasks in parallel.
 * Returns results in the same order as the input tasks.
 *
 * @example
 *   const results = await runPool(imageUris.map(uri => () => processImage(uri)), 3);
 */
export async function runPool<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number,
    onProgress?: (completed: number, total: number) => void,
): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let nextIndex = 0;
    let completed = 0;

    async function worker(): Promise<void> {
        while (nextIndex < tasks.length) {
            const index = nextIndex++;
            results[index] = await tasks[index]();
            completed++;
            onProgress?.(completed, tasks.length);
        }
    }

    const workers = Array.from(
        { length: Math.min(concurrency, tasks.length) },
        () => worker(),
    );

    await Promise.all(workers);
    return results;
}
