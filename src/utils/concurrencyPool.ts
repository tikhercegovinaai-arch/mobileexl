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
    tasks: ((onProgress: (progress: number) => void) => Promise<T>)[],
    concurrency: number,
    onProgress?: (completed: number, total: number, taskIndex?: number, taskProgress?: number) => void,
): Promise<T[]> {
    const results: T[] = new Array(tasks.length);
    let nextIndex = 0;
    let completedCount = 0;

    async function worker(): Promise<void> {
        while (nextIndex < tasks.length) {
            const index = nextIndex++;
            
            // Run task and provide a progress callback for it
            results[index] = await tasks[index]((taskProgress) => {
                onProgress?.(completedCount, tasks.length, index, taskProgress);
            });

            completedCount++;
            onProgress?.(completedCount, tasks.length, index, 100);
        }
    }

    const workers = Array.from(
        { length: Math.min(concurrency, tasks.length) },
        () => worker(),
    );

    await Promise.all(workers);
    return results;
}

