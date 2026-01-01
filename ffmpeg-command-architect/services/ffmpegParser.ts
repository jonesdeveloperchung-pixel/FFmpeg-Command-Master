
export interface FFmpegProgress {
  frame: number;
  fps: number;
  time: string;
  bitrate: string;
  speed: string;
  percent: number;
}

export const parseFFmpegProgress = (data: string, totalDurationInSeconds: number = 0): Partial<FFmpegProgress> | null => {
  // Typical line: frame=  123 fps= 30 q=28.0 size=    1024kB time=00:00:05.12 bitrate=1638.4kbits/s speed=1.2x
  const timeMatch = data.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
  if (!timeMatch) return null;

  const timeStr = timeMatch[1];
  const [hh, mm, ss] = timeStr.split(':').map(parseFloat);
  const currentTimeInSeconds = hh * 3600 + mm * 60 + ss;

  let percent = 0;
  if (totalDurationInSeconds > 0) {
    percent = Math.min(100, Math.round((currentTimeInSeconds / totalDurationInSeconds) * 100));
  }

  const fpsMatch = data.match(/fps=\s*([\d.]+)/);
  const bitrateMatch = data.match(/bitrate=\s*([\d.kmbits/s]+)/);
  const speedMatch = data.match(/speed=\s*([\d.x]+)/);

  return {
    time: timeStr,
    fps: fpsMatch ? parseFloat(fpsMatch[1]) : 0,
    bitrate: bitrateMatch ? bitrateMatch[1] : '',
    speed: speedMatch ? speedMatch[1] : '',
    percent
  };
};

export const parseFFmpegError = (stderr: string): string => {
  if (stderr.includes("Invalid data found when processing input")) {
    return "找不到輸入檔案或格式無效。";
  }
  if (stderr.includes("Unknown encoder")) {
    return "不支援的編碼器，請檢查硬體加速設定。";
  }
  if (stderr.includes("Permission denied")) {
    return "權限不足，無法寫入輸出路徑。";
  }
  return "執行失敗，請檢查參數是否正確。";
};
