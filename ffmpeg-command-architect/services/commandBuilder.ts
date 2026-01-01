import { FFmpegState } from '../types';

/**
 * FFmpegCommandBuilder helps in constructing FFmpeg arguments in a structured way.
 * It handles escaping and ordering of arguments.
 */
export class FFmpegCommandBuilder {
  private args: string[] = [];

  constructor(private state: FFmpegState) {}

  /**
   * Builds the final argument array.
   * If AI Override is active, it returns the AI command split into parts.
   */
  public buildArgs(): string[] {
    if (this.state.aiOverride && this.state.aiCommand) {
      // Basic splitting for AI command, though array-based is preferred
      // In a real scenario, the AI should return an array or we should parse it better.
      return this.state.aiCommand.replace(/^ffmpeg\s+/, '').split(/\s+/);
    }

    this.args = [];

    // 1. Global Options
    if (this.state.logLevel !== 'info') {
      this.args.push('-v', this.state.logLevel);
    }
    if (this.state.overwrite === 'y') {
      this.args.push('-y');
    } else if (this.state.overwrite === 'n') {
      this.args.push('-n');
    }
    if (this.state.stats) {
      this.args.push('-stats');
    }

    // 2. Input Options (Before -i)
    if (this.state.startTime) {
      this.args.push('-ss', this.state.startTime);
    }

    // 3. Inputs
    if (this.state.inputFiles.length > 0) {
      // For the generated command preview, we usually show the first file or a placeholder
      // If batching is active, the executor handles the loop.
      this.state.inputFiles.forEach(file => {
        this.args.push('-i', file || 'input.mp4');
      });
    } else {
      this.args.push('-i', 'input.mp4');
    }

    // 4. Output Options (After -i)
    
    // Timing on output side if preferred or needed
    if (this.state.duration) {
      this.args.push('-t', this.state.duration);
    }
    if (this.state.stopTime) {
      this.args.push('-to', this.state.stopTime);
    }

    // Format
    if (this.state.format) {
      this.args.push('-f', this.state.format);
    }

    // Video
    if (this.state.disableVideo) {
      this.args.push('-vn');
    } else {
      if (this.state.videoCodec) {
        this.args.push('-c:v', this.state.videoCodec);
      }
      if (this.state.videoBitrate) {
        this.args.push('-b:v', this.state.videoBitrate);
      }
      if (this.state.frameRate) {
        this.args.push('-r', this.state.frameRate);
      }
      if (this.state.aspectRatio) {
        this.args.push('-aspect', this.state.aspectRatio);
      }
      if (this.state.videoFilters) {
        this.args.push('-vf', this.state.videoFilters);
      }
    }

    // Audio
    if (this.state.disableAudio) {
      this.args.push('-an');
    } else {
      if (this.state.audioCodec) {
        this.args.push('-c:a', this.state.audioCodec);
      }
      if (this.state.audioBitrate) {
        this.args.push('-b:a', this.state.audioBitrate);
      }
      if (this.state.sampleRate) {
        this.args.push('-ar', this.state.sampleRate);
      }
      if (this.state.channels) {
        this.args.push('-ac', this.state.channels);
      }
      if (this.state.audioFilters) {
        this.args.push('-af', this.state.audioFilters);
      }
    }

    // Subtitle
    if (this.state.disableSubtitle) {
      this.args.push('-sn');
    } else if (this.state.subtitleCodec) {
      this.args.push('-c:s', this.state.subtitleCodec);
    }

    // Metadata
    Object.entries(this.state.metadata).forEach(([key, value]) => {
      this.args.push('-metadata', `${key}=${value}`);
    });

    // Custom Args - split by space but handle quotes if possible
    // Simplified for now:
    if (this.state.customArgs) {
      const custom = this.state.customArgs.trim().split(/\s+/);
      this.args.push(...custom);
    }

    // 5. Final Output
    this.args.push(this.state.outputFile);

    return this.args;
  }

  /**
   * Validates the current state and returns a list of warnings.
   */
  public validate(): string[] {
    const warnings: string[] = [];
    
    // Check if input files exist in state
    if (this.state.inputFiles.length === 0 || !this.state.inputFiles[0]) {
      warnings.push('No input file specified.');
    }

    // Check codec compatibility (basic)
    if (this.state.videoCodec === 'copy' && this.state.videoFilters) {
      warnings.push('Video filters (-vf) will be ignored when using "copy" codec.');
    }
    if (this.state.audioCodec === 'copy' && this.state.audioFilters) {
      warnings.push('Audio filters (-af) will be ignored when using "copy" codec.');
    }

    // Check for potential conflicts
    if (this.state.duration && this.state.stopTime) {
      warnings.push('Both duration (-t) and stop time (-to) are specified. FFmpeg might prioritize -t.');
    }

    // Format-specific warnings
    if (this.state.format === 'gif' && this.state.videoCodec !== 'gif' && this.state.videoCodec !== 'libx264') {
      // libx264 can't really output GIF directly without complex filters, usually we use gif encoder
    }

    return warnings;
  }

  /**
   * Returns the command as a single string for display.
   * Handles quoting of arguments with spaces.
   */
  public toString(): string {
    const args = this.buildArgs();
    const quotedArgs = args.map(arg => {
      if (arg.includes(' ') || arg.includes('"') || arg.includes("'") || arg === '') {
        return `"${arg.replace(/"/g, '\"')}"`;
      }
      return arg;
    });
    return `ffmpeg ${quotedArgs.join(' ')}`;
  }
}

export const buildFFmpegCommand = (state: FFmpegState): string => {
  return new FFmpegCommandBuilder(state).toString();
};
