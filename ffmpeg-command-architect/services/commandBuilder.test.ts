import { describe, it, expect } from 'vitest';
import { FFmpegCommandBuilder } from './commandBuilder';
import { INITIAL_STATE, FFmpegState } from '../types';

describe('FFmpegCommandBuilder', () => {
  it('should build a basic command', () => {
    const builder = new FFmpegCommandBuilder(INITIAL_STATE);
    const command = builder.toString();
    expect(command).toContain('ffmpeg');
    expect(command).toContain('-i input.mp4');
    expect(command).toContain('output.mp4');
  });

  it('should handle video codec and filters', () => {
    const state: FFmpegState = {
      ...INITIAL_STATE,
      videoCodec: 'libx264',
      videoFilters: 'scale=1280:720'
    };
    const builder = new FFmpegCommandBuilder(state);
    const args = builder.buildArgs();
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-vf');
    expect(args).toContain('scale=1280:720');
  });

  it('should validate conflicting options', () => {
    const state: FFmpegState = {
      ...INITIAL_STATE,
      videoCodec: 'copy',
      videoFilters: 'scale=1280:720'
    };
    const builder = new FFmpegCommandBuilder(state);
    const warnings = builder.validate();
    expect(warnings).toContain('Video filters (-vf) will be ignored when using "copy" codec.');
  });

  it('should handle audio options', () => {
    const state: FFmpegState = {
      ...INITIAL_STATE,
      audioCodec: 'aac',
      audioBitrate: '192k'
    };
    const builder = new FFmpegCommandBuilder(state);
    const args = builder.buildArgs();
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
    expect(args).toContain('-b:a');
    expect(args).toContain('192k');
  });
});
