/**
 * Type declarations for react-native-llama
 * This module provides local LLM inference capabilities
 */

export interface LlamaContext {
    completion: (options: CompletionOptions, callback?: (response: CompletionResponse) => void) => Promise<CompletionResult>;
    release: () => Promise<void>;
}

export interface CompletionOptions {
    prompt: string;
    grammar?: string;
    stop?: string[];
    temperature?: number;
    n_predict?: number;
}

export interface CompletionResponse {
    text: string;
    done: boolean;
}

export interface CompletionResult {
    text: string;
    done: boolean;
}

export interface InitLlamaOptions {
    model: string;
    use_mlock?: boolean;
    n_ctx?: number;
    n_gpu_layers?: number;
}

export declare function initLlama(options: InitLlamaOptions): Promise<LlamaContext>;
