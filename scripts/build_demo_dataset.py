"""
Build a mock Mel dataset with both NORMAL and ANOMALY frames
for the ESP32 simulator demo.

Usage:
  python scripts/build_demo_dataset.py

Output:
  scripts/mock_mel_dataset.json  (overwritten with normal + anomaly frames)
"""
import json
import os
import numpy as np
import librosa

# ---------- Config ----------
SR = 16000
N_FFT = 1024
HOP_LENGTH = 512
N_MELS = 128
FRAMES = 64  # must match model input: (1, 1, 128, 64)

AUDIO_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'test-assets', 'audio')
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), 'mock_mel_dataset.json')


def wav_to_mel_frames(wav_path: str) -> list[np.ndarray]:
    """Load a WAV, compute log-Mel, split into non-overlapping 64-frame windows."""
    y, _ = librosa.load(wav_path, sr=SR)
    mel = librosa.feature.melspectrogram(y=y, sr=SR, n_fft=N_FFT, hop_length=HOP_LENGTH, n_mels=N_MELS)
    log_mel = librosa.power_to_db(mel, ref=np.max)

    # min-max normalize to [0, 1]
    mel_min, mel_max = log_mel.min(), log_mel.max()
    if mel_max - mel_min > 1e-6:
        log_mel = (log_mel - mel_min) / (mel_max - mel_min)
    else:
        log_mel = np.zeros_like(log_mel)

    # split into 64-frame windows
    total_frames = log_mel.shape[1]
    windows = []
    for start in range(0, total_frames - FRAMES + 1, FRAMES):
        window = log_mel[:, start:start + FRAMES]  # (128, 64)
        windows.append(window)
    return windows


def main():
    dataset = []

    for filename in sorted(os.listdir(AUDIO_DIR)):
        if not filename.endswith('.wav'):
            continue

        filepath = os.path.join(AUDIO_DIR, filename)
        label = 'anomaly' if 'anomaly' in filename else 'normal'
        frames = wav_to_mel_frames(filepath)

        for frame in frames:
            dataset.append({
                'type': label,
                'source': filename,
                'melFrame': frame.flatten().tolist()  # 128*64 = 8192 floats
            })

        print(f'  [{label.upper():>7s}] {filename} -> {len(frames)} frames')

    # Arrange: put normals first, then anomalies at the end for dramatic demo effect
    normals = [d for d in dataset if d['type'] == 'normal']
    anomalies = [d for d in dataset if d['type'] == 'anomaly']

    # Take a representative subset to keep demo length reasonable
    # ~80 normal + all anomaly frames
    final = normals[:80] + anomalies
    print(f'\nFinal dataset: {len(final)} frames ({len(normals[:80])} normal + {len(anomalies)} anomaly)')

    with open(OUTPUT_PATH, 'w') as f:
        json.dump(final, f)

    size_mb = os.path.getsize(OUTPUT_PATH) / 1024 / 1024
    print(f'Written to {OUTPUT_PATH} ({size_mb:.1f} MB)')


if __name__ == '__main__':
    main()
