import {ChildProcess, spawn, SpawnOptionsWithoutStdio} from "child_process";
import EventEmitter from "node:events";
import {opus} from "prism-media";
import Encoder = opus.Encoder;
import {Readable} from "stream";


type Option = {
	/**
	 * 録音するオーディオデバイス
	 */
	device: string | null,


	/**
	 * 録音に使用するドライバ
	 */
	driver: string | null,

	/**
	 * 量子化ビット数
	 * -b オプションに対応
	 */
	bits: number,

	/**
	 * サンプリングレート
	 * -r オプションに対応
	 */
	rate: number

	/**
	 * チャンネル数
	 * -c オプションに対応
	 */
	channels: 1 | 2,

	/**
	 * 出力のエンディアン
	 */
	endian: Endian,

	/**
	 * 出力形式
	 * -t オプションに対応
	 */
	outputType: string,


	/**
	 * 出力エンコードの形式
	 */
	encoding: Encoding,


	/**
	 * 出力streamをopusエンコードするかどうか
	 */
	opusEncode: boolean,

	silence: {
		keepSilence: boolean,
		above: SilenceSubOption,
		below?: SilenceSubOption
	} | null;
}

type SilenceSubOption = {
	times: number,
	durationSec: Duration,
	threshold: Threshold,
}

type Threshold = `${number}%` | `${number}d`;
type Duration = `${number}t` | `${number}:${number}` | `${number}:${number}:${number}` | number;

export type Encoding = "signed-integer" | "unsigned-integer" | "floating-point" | "a-law" | "u-law" | "mu-law" | "oki-adpcm" | "ms-adpcm" | "gsm-full-rate";

export const Endian = {
	big: "-B",
	little: "-L",
	swap: "-X"
} as const;
type Endian = typeof Endian[keyof typeof Endian];

const defaultOption: Option = {
	device: null,
	driver: null,
	bits: 16,
	rate: 16000,
	channels: 1,
	endian: Endian.little,
	outputType: "wav",
	encoding: "signed-integer",
	opusEncode: false,
	silence: null,
}



class SoXRecorder extends EventEmitter{
	childProcess: ChildProcess | undefined;
	options: Option;
	opusEncoder: Encoder | undefined

	constructor(options: Partial<Option>){
		super();

		this.options = {
			...defaultOption,
			...options
		}

		if(this.options.opusEncode){
			this.opusEncoder = new Encoder({
				channels: this.options.channels,
				rate: this.options.rate,
				frameSize: 960
			});
		}
	}

	constructCommandArguments(): string[]{
		const args = [];
		args.push("-d");
		args.push("-q");
		args.push("-c", this.options.channels.toString());
		args.push("-r", this.options.rate.toString());
		args.push("-t", this.options.outputType);
		args.push("-V0");
		args.push(this.options.endian);
		args.push("-b", this.options.bits.toString());
		args.push("-e", this.options.outputType);
		args.push("-");

		if(this.options.silence){
			const effectOpt = this.options.silence;
			args.push("silence");
			if(effectOpt.keepSilence){
				args.push("-l");
			}
			args.push(effectOpt.above.times.toString(), effectOpt.above.durationSec.toString(), effectOpt.above.threshold);
			if(effectOpt.below){
				args.push(effectOpt.below.times.toString(), effectOpt.below.durationSec.toString(), effectOpt.below.threshold);
			}
		}

		return args;
	}

	constructCommandOptions(){

		const env = process.env;

		if(this.options.device){
			env.AUDIOENV = this.options.device;
		}
		if(this.options.driver){
			env.AUDIODRIVER = this.options.driver;
		}

		return {
			encoding: "binary",
			env: process.env,
		}
	}

	start(): this {
		if(this.childProcess){
			this.childProcess.kill();
		}

		const args = this.constructCommandArguments();
		const opts = this.constructCommandOptions();
		this.childProcess = spawn("sox", args, opts);

		this.childProcess.on("close", code => {
			this.emit("close", code);
		})

		return this;
	}

	stop(): this {
		if(!this.childProcess){
			return this;
		}

		this.childProcess.kill();
		this.childProcess = undefined;

		return this;
	}

	stream(): Readable | null {
		if(!this.childProcess || !this.childProcess.stdout){
			return null;
		}
		if(!this.opusEncoder){
			return this.childProcess.stdout;
		}
		return this.childProcess.stdout.pipe(this.opusEncoder);
	}

}
