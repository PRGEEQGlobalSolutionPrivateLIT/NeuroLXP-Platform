import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class SmsService {
  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID
  private readonly authToken = process.env.TWILIO_AUTH_TOKEN
  private readonly verifyServiceSid = process.env.TWILIO_VERIFY_SID
  private readonly logger = new Logger(SmsService.name)

  private normalizePhone(phone: string) {
    const trimmed = phone.trim()
    if (trimmed.startsWith('+')) {
      return trimmed
    }
    if (/^\d{10}$/.test(trimmed)) {
      return `+91${trimmed}`
    }
    return trimmed
  }

  async sendSmsVerification(phoneNumber: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.verifyServiceSid) {
      throw new InternalServerErrorException('Twilio SMS credentials are not configured')
    }

    const to = this.normalizePhone(phoneNumber)
    const url = `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/Verifications`
    const payload = new URLSearchParams({
      To: to,
      Channel: 'sms',
    })

    try {
      await axios.post(url, payload.toString(), {
        auth: {
          username: this.accountSid,
          password: this.authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    } catch (error: any) {
      this.logger.error('Twilio verification send failed', error?.response?.data || error.message)
      throw new InternalServerErrorException('Failed to send SMS OTP')
    }
  }

  async verifySmsCode(phoneNumber: string, code: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.verifyServiceSid) {
      throw new InternalServerErrorException('Twilio SMS credentials are not configured')
    }

    const to = this.normalizePhone(phoneNumber)
    const url = `https://verify.twilio.com/v2/Services/${this.verifyServiceSid}/VerificationCheck`
    const payload = new URLSearchParams({
      To: to,
      Code: code,
    })

    try {
      const response = await axios.post(url, payload.toString(), {
        auth: {
          username: this.accountSid,
          password: this.authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return response.data?.status === 'approved'
    } catch (error: any) {
      this.logger.error('Twilio verification check failed', error?.response?.data || error.message)
      return false
    }
  }
}
