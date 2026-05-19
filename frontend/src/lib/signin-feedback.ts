import neoToast from '@/lib/toast';

/** Short success chime via Web Audio (no external file). */
export function playSignInSuccessSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
    void ctx.close();
  } catch {
    /* autoplay blocked or unsupported */
  }
}

export function toastOtpSent(remaining: number, channel: 'email' | 'phone', isDev?: boolean) {
  const via = channel === 'email' ? 'email' : 'SMS';
  if (isDev) {
    neoToast.success(`📨 OTP sent to your ${via} · Dev code below · ${remaining} send${remaining === 1 ? '' : 's'} left`);
  } else {
    neoToast.success(`📨 OTP sent to your ${via} · ${remaining} send${remaining === 1 ? '' : 's'} left`);
  }
}

export function toastOtpVerifyFail(remaining: number, limit: number) {
  if (remaining <= 0) {
    neoToast.error(`❌ Wrong OTP · All ${limit} attempts used`);
  } else if (remaining === 1) {
    neoToast.error(`❌ Wrong OTP · 1 attempt left`);
  } else {
    neoToast.error(`❌ Wrong OTP · ${remaining} attempts left`);
  }
}

export function toastAutoNextMethod(nextLabel: string) {
  neoToast.info(`🔄 ${nextLabel}`);
}

export function toastSignInSuccess() {
  playSignInSuccessSound();
  neoToast.success('🎉 Welcome back! Sign-in successful');
}

export function toastPasswordMatched() {
  neoToast.success('✅ Password matched — verify with OTP');
}

export function toastSendLimitReached(channel: 'primary' | 'alt') {
  if (channel === 'primary') {
    neoToast.info('📵 Primary OTP send limit reached · Switching to alternative contact…');
  } else {
    neoToast.info('📵 Alternative OTP send limit reached · Switching to authenticator…');
  }
}
