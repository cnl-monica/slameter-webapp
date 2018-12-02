import smtplib
from email import encoders
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from accounting.models import AccProvider
from email.mime.multipart import MIMEMultipart
from smtpconfig import SENDER, CC, SLAMETER_INFO
from smtp_connection import SmtpConnection
COMMASPACE = ', '


def send_mail(to_addr_list, subject, text, pdf, filename):
    outer = MIMEMultipart()
    outer['Subject'] = subject
    outer['To'] = COMMASPACE.join(to_addr_list + CC)
    outer['From'] = SENDER
    outer['Cc'] = COMMASPACE.join(CC)

    ctype = 'application/octet-stream'
    maintype, subtype = ctype.split('/', 1)
    acc_provider = AccProvider.objects.get(id=1)
    text_content = MIMEText(str(text) + str(acc_provider.email) + SLAMETER_INFO, 'plain')

    pdf_content = MIMEBase(maintype, subtype)
    pdf_content.set_payload(pdf.content)
    encoders.encode_base64(pdf_content)
    pdf_content.add_header('Content-Disposition', 'attachment', filename=filename)
    outer.attach(text_content)
    outer.attach(pdf_content)
    composed = outer.as_string()
    errmsg = ''
    server = SmtpConnection()
    ret = server.send_message(SENDER, to_addr_list + CC, composed)
    errmsg = ret['errmsg']
    print errmsg
    return {
        'success': ret['success'], 'errmsg': errmsg
    }
