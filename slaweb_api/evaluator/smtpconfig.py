SMTP_SERVER = 'smtp.zoznam.sk:587'
# SMTP_SERVER = 'smtp.gmail.com:587'
# mode ('normal'|'tls'|'ssl')
SMTP_MODE = 'normal'
AUTH_LOGIN = 'slameterservice@zoznam.sk'
AUTH_PASSWORD = 'Monicateam0'
SENDER = 'slameterservice@zoznam.sk'
CC = ['slameterservice@centrum.sk']

# DEFAULT EMAIL TEXTS

BASE_SUBJECT = 'SLAmeter Bill - '
CRITERIA_SUBJECT = BASE_SUBJECT + 'Criteria Evaluation method'
SPEED_SUBJECT = BASE_SUBJECT + 'Speed (95th Percentile) Evaluation method'
VOLUME_SUBJECT = BASE_SUBJECT + 'Volume Evaluation method'

BASE_TEXT_SAL = 'Dear Customer '
BASE_TEXT_CONTENT = '\n\nFor billing network services, your company or ISP used SLAmeter tool.\nIn attachement is yours invoice for last period.\n\nBest regards\n \n\nIf you have any questions, please contact us on: '
DEFAULT_FILENAME = 'SLAmeter_Invoice.pdf'

SLAMETER_INFO = '\nInfo about SLAmeter: http://wiki.cnl.sk/Monica/SLAmeter'