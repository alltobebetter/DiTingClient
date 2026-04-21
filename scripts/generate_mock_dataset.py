import numpy as np
import librosa
import json
import os

SAMPLE_RATE = 16000
N_FFT = 1024
HOP_LENGTH = 512
N_MELS = 128
TARGET_FRAMES = 64
DURATION = 2.05 # 2.048s = exactly 64 frames for 16kHz with 512 hop length

def wav_to_log_mel(y):
    mel = librosa.feature.melspectrogram(
        y=y, sr=SAMPLE_RATE, n_fft=N_FFT, hop_length=HOP_LENGTH, n_mels=N_MELS
    )
    log_mel = librosa.power_to_db(mel, ref=np.max)
    if log_mel.shape[1] >= TARGET_FRAMES:
        log_mel = log_mel[:, :TARGET_FRAMES]
    else:
        pad_width = TARGET_FRAMES - log_mel.shape[1]
        log_mel = np.pad(log_mel, ((0, 0), (0, pad_width)), mode='constant', constant_values=-80.0)
    return log_mel.astype(np.float32)

def generate_fan_sound(duration, is_abnormal=False):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    # Base hum (50Hz mains + harmonics)
    wave = 0.5 * np.sin(2 * np.pi * 50 * t) + 0.2 * np.sin(2 * np.pi * 150 * t) + 0.1 * np.sin(2 * np.pi * 250 * t)
    # Add blade aerodynamic noise (brown noise approximation via lowpass white noise)
    noise = np.random.normal(0, 0.3, len(t))
    wave += noise
    
    if is_abnormal:
        # Add intermittent metallic clanks or grinding
        num_clanks = np.random.randint(2, 6)
        for _ in range(num_clanks):
            clank_start = np.random.randint(0, len(t) - 2000)
            clank_len = 2000
            # Burst of high frequency energy
            clank = np.random.normal(0, 2.0, clank_len) * np.exp(-np.linspace(0, 5, clank_len))
            wave[clank_start:clank_start+clank_len] += clank
            
    # Normalize
    max_val = np.max(np.abs(wave))
    if max_val > 0:
        wave = wave / max_val
    return wave

def main():
    frames = []
    print("Generating 100 normal frames...")
    for i in range(100):
        wave = generate_fan_sound(DURATION, is_abnormal=False)
        mel = wav_to_log_mel(wave)
        mel_flat = mel.flatten().tolist()
        frames.append({"type": "normal", "melFrame": mel_flat})
        if i % 20 == 0:
            print(f"  ... {i}/100")

    print("Generating 30 abnormal frames...")
    for i in range(30):
        wave = generate_fan_sound(DURATION, is_abnormal=True)
        mel = wav_to_log_mel(wave)
        mel_flat = mel.flatten().tolist()
        frames.append({"type": "abnormal", "melFrame": mel_flat})
        if i % 10 == 0:
            print(f"  ... {i}/30")

    # Shuffle abnormal frames to simulate random faults? 
    # Or just keep them at the end. We'll let the mock script handle playback.

    out_file = 'mock_mel_dataset.json'
    with open(out_file, 'w') as f:
        json.dump(frames, f)
    print(f"Done! Created {out_file} ({os.path.getsize(out_file) / 1024 / 1024:.2f} MB)")

if __name__ == "__main__":
    main()
