import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { env, pipeline } from '@huggingface/transformers';
import { join } from 'node:path';

type TranslationOutput = {
  translation_text?: unknown;
};

type TranslationPipelineRunner = (
  texts: string | string[],
  options?: Record<string, unknown>,
) => Promise<unknown>;

type TranslationDtype =
  | 'fp32'
  | 'fp16'
  | 'q8'
  | 'int8'
  | 'uint8'
  | 'q4'
  | 'bnb4'
  | 'q4f16';

const TRANSLATION_BATCH_SIZE = 12;
const TRANSLATION_BATCH_CHARACTER_LIMIT = 4000;
const DEFAULT_MODEL = 'Xenova/opus-mt-es-en';
const DEFAULT_DTYPE: TranslationDtype = 'q8';

@Injectable()
export class ReportTranslationService {
  private readonly logger = new Logger(ReportTranslationService.name);
  private readonly translationCache = new Map<string, string>();
  private readonly modelId: string;
  private readonly dtype: TranslationDtype;
  private readonly cacheDir: string;
  private readonly localModelPath: string | null;
  private readonly allowRemoteModels: boolean;
  private readonly required: boolean;
  private translatorPromise: Promise<TranslationPipelineRunner> | null = null;

  constructor(private readonly configService: ConfigService) {
    this.modelId = this.optionalString(
      this.configService.get<string>('REPORT_TRANSLATION_MODEL'),
    ) ?? DEFAULT_MODEL;
    this.dtype = this.translationDtype(
      this.configService.get<string>('REPORT_TRANSLATION_DTYPE'),
    );
    this.cacheDir = this.optionalString(
      this.configService.get<string>('REPORT_TRANSLATION_CACHE_DIR'),
    ) ?? this.defaultCacheDir();
    this.localModelPath = this.optionalString(
      this.configService.get<string>('REPORT_TRANSLATION_LOCAL_MODEL_PATH'),
    );
    this.allowRemoteModels = this.booleanValue(
      this.configService.get<string | boolean>('REPORT_TRANSLATION_ALLOW_REMOTE_MODELS'),
      true,
    );
    this.required = this.booleanValue(
      this.configService.get<string | boolean>('REPORT_TRANSLATION_REQUIRED'),
      true,
    );

    env.cacheDir = this.cacheDir;
    env.allowRemoteModels = this.allowRemoteModels;
    env.allowLocalModels = true;
    if (this.localModelPath) env.localModelPath = this.localModelPath;
  }

  async translateToEnglish(values: string[]): Promise<string[]> {
    const normalizedValues = values.map((value) => value.trim());
    const missingValues = Array.from(
      new Set(
        normalizedValues.filter(
          (value) => value.length > 0 && !this.translationCache.has(value),
        ),
      ),
    );

    for (const batch of this.translationBatches(missingValues)) {
      try {
        const translations = await this.translateBatch(batch);
        batch.forEach((source, index) => {
          const translation = translations[index]?.trim() ?? '';
          if (translation) this.translationCache.set(source, translation);
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(`Local report translation failed: ${message}`);
        if (this.required) {
          throw new ServiceUnavailableException(
            'No fue posible generar el informe bilingüe porque el traductor local no está disponible.',
          );
        }
      }
    }

    return normalizedValues.map((value) =>
      value ? this.translationCache.get(value) ?? '' : '',
    );
  }

  private async translateBatch(values: string[]): Promise<string[]> {
    if (values.length === 0) return [];

    const translator = await this.getTranslator();
    const output = await translator(values, {
      max_new_tokens: 512,
      do_sample: false,
    });
    const translations = this.translationTexts(output);

    if (translations.length !== values.length) {
      throw new Error(
        `Transformers.js returned ${translations.length} translations for ${values.length} source texts.`,
      );
    }

    return translations;
  }

  private async getTranslator(): Promise<TranslationPipelineRunner> {
    if (!this.translatorPromise) {
      this.logger.log(
        `Loading report translation model ${this.modelId} (${this.dtype}) into ${this.cacheDir}`,
      );
      this.translatorPromise = pipeline('translation', this.modelId, {
        dtype: this.dtype,
      })
        .then((translator) => translator as unknown as TranslationPipelineRunner)
        .catch((error) => {
          this.translatorPromise = null;
          throw error;
        });
    }

    return this.translatorPromise;
  }

  private translationTexts(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.translationTexts(entry));
    }
    if (!value || typeof value !== 'object') return [];

    const translatedText = (value as TranslationOutput).translation_text;
    return typeof translatedText === 'string' && translatedText.trim()
      ? [translatedText.trim()]
      : [];
  }

  private translationBatches(values: string[]): string[][] {
    const batches: string[][] = [];
    let currentBatch: string[] = [];
    let currentCharacters = 0;

    for (const value of values) {
      const exceedsSize = currentBatch.length >= TRANSLATION_BATCH_SIZE;
      const exceedsCharacters =
        currentBatch.length > 0
        && currentCharacters + value.length > TRANSLATION_BATCH_CHARACTER_LIMIT;
      if (exceedsSize || exceedsCharacters) {
        batches.push(currentBatch);
        currentBatch = [];
        currentCharacters = 0;
      }
      currentBatch.push(value);
      currentCharacters += value.length;
    }

    if (currentBatch.length > 0) batches.push(currentBatch);
    return batches;
  }

  private defaultCacheDir(): string {
    const home = process.env.HOME?.trim() || process.env.USERPROFILE?.trim();
    return join(home || process.cwd(), '.cache', 'aurelia', 'transformers');
  }

  private translationDtype(value: string | undefined): TranslationDtype {
    const normalized = value?.trim();
    if (
      normalized === 'fp32'
      || normalized === 'fp16'
      || normalized === 'q8'
      || normalized === 'int8'
      || normalized === 'uint8'
      || normalized === 'q4'
      || normalized === 'bnb4'
      || normalized === 'q4f16'
    ) {
      return normalized;
    }
    return DEFAULT_DTYPE;
  }

  private optionalString(value: string | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized || null;
  }

  private booleanValue(value: string | boolean | undefined, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
  }
}
