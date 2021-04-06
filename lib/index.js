"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", {value: true});
exports.SoXRecorder = exports.Endian = void 0;
var child_process_1 = require("child_process");
var node_events_1 = __importDefault(require("node:events"));
var prism_media_1 = require("prism-media");
var Encoder = prism_media_1.opus.Encoder;
exports.Endian = {
    big: "-B",
    little: "-L",
    swap: "-X"
};
var defaultOption = {
    device: null,
    driver: null,
    bits: 16,
    rate: 16000,
    channels: 1,
    endian: exports.Endian.little,
    outputType: "wav",
    encoding: "signed-integer",
    opusEncode: false,
    silence: null,
};
var SoXRecorder = /** @class */ (function (_super) {
    __extends(SoXRecorder, _super);
    function SoXRecorder(options) {
        var _this = _super.call(this) || this;
        _this.options = __assign(__assign({}, defaultOption), options);
        if (_this.options.opusEncode) {
            _this.opusEncoder = new Encoder({
                channels: _this.options.channels,
                rate: _this.options.rate,
                frameSize: 960
            });
        }
        return _this;
    }
    SoXRecorder.prototype.constructCommandArguments = function (){
        var args = [];
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
            var effectOpt = this.options.silence;
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
    };
    SoXRecorder.prototype.constructCommandOptions = function () {
        var env = process.env;
        if (this.options.device) {
            env.AUDIOENV = this.options.device;
        }
        if (this.options.driver) {
            env.AUDIODRIVER = this.options.driver;
        }
        return {
            encoding: "binary",
            env: process.env,
        };
    };
    SoXRecorder.prototype.start = function () {
        var _this = this;
        if (this.childProcess) {
            this.childProcess.kill();
        }
        var args = this.constructCommandArguments();
        var opts = this.constructCommandOptions();
        this.childProcess = child_process_1.spawn("sox", args, opts);
        this.childProcess.on("close", function (code) {
            _this.emit("close", code);
        });
        return this;
    };
    SoXRecorder.prototype.stop = function () {
        if (!this.childProcess) {
            return this;
        }
        this.childProcess.kill();
        this.childProcess = undefined;
        return this;
    };
    SoXRecorder.prototype.stream = function () {
        if (!this.childProcess || !this.childProcess.stdout) {
            return null;
        }
        if (!this.opusEncoder) {
            return this.childProcess.stdout;
        }
        return this.childProcess.stdout.pipe(this.opusEncoder);
    };
    return SoXRecorder;
}(node_events_1.default));
exports.SoXRecorder = SoXRecorder;
