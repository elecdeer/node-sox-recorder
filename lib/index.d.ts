/// <reference types="node" />
import {ChildProcess} from "child_process";
import {opus} from "prism-media";
import {Readable} from "stream";
import {EventEmitter} from "events";
import Encoder = opus.Encoder;

declare type Option = {
    /**
     * 録音するオーディオデバイス
     */
    device: string | null;
    /**
     * 録音に使用するドライバ
     */
    driver: string | null;
    /**
     * 量子化ビット数
     * -b オプションに対応
     */
    bits: number;
    /**
     * サンプリングレート
     * -r オプションに対応
     */
    rate: number;
    /**
     * チャンネル数
     * -c オプションに対応
     */
    channels: 1 | 2;
    /**
     * 出力のエンディアン
     */
    endian: Endian;
    /**
     * 出力形式
     * -t オプションに対応
     */
    outputType: string;
    /**
     * 出力エンコードの形式
     */
    encoding: Encoding;
    /**
     * 出力streamをopusエンコードするかどうか
     */
    opusEncode: boolean;
    silence: {
        keepSilence?: boolean;
        above: SilenceSubOption;
        below?: SilenceSubOption;
    } | null;
};
declare type SilenceSubOption = {
    times: number;
    durationSec: Duration;
    threshold: Threshold;
};
declare type Threshold = `${number}%` | `${number}d`;
declare type Duration = `${number}t` | `${number}:${number}` | `${number}:${number}:${number}` | number;
export declare type Encoding =
  "signed-integer"
  | "unsigned-integer"
  | "floating-point"
  | "a-law"
  | "u-law"
  | "mu-law"
  | "oki-adpcm"
  | "ms-adpcm"
  | "gsm-full-rate";
export declare const Endian: {
    readonly big: "-B";
    readonly little: "-L";
    readonly swap: "-X";
};
declare type Endian = typeof Endian[keyof typeof Endian];

export declare class SoXRecorder extends EventEmitter{
    childProcess: ChildProcess | undefined;
    options: Option;
    opusEncoder: Encoder | undefined;
    logger?: Console;

    constructor(options: Partial<Option>, logger?: Console);

    constructCommandArguments(): string[];

    constructCommandOptions(): {
        encoding: string;
        env: NodeJS.ProcessEnv;
    };

    start(): this;

    stop(): this;

    stream(): Readable | null;
}
export {};
//# sourceMappingURL=index.d.ts.map