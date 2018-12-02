import smtplib
import socket
from smtpconfig import SMTP_SERVER, AUTH_LOGIN, AUTH_PASSWORD, SMTP_MODE


class SmtpConnection:
    connection = None

    def __init__(self):

        try:
            if SMTP_MODE == 'ssl':
                server = smtplib.SMTP_SSL(SMTP_SERVER)
            else:
                server = smtplib.SMTP(SMTP_SERVER)
                if SMTP_MODE == 'tls':
                    server.starttls()
                server.login(AUTH_LOGIN, AUTH_PASSWORD)
            self.connection = server
            success = True
        except (socket.error, ), e:
            print 'server %s not responding: %s' % (SMTP_SERVER, e)
        except smtplib.SMTPAuthenticationError, e:
            print 'authentication error: %s' % (e, )
        except smtplib.SMTPDataError, e:
            print 'SMTP protocol mismatch: %s' % (e, )
        except smtplib.SMTPHeloError, e:
            print "server didn't reply properly to the HELO greeting: %s" % (e, )
        except smtplib.SMTPException, e:
            print 'SMTP error: %s' % (e, )
        except Exception, e:
            print str(e)

    def send_message(self, sender_address, addr_list, composed):
        errmsg = ''
        success = False
        try:
            ret = self.connection.sendmail(sender_address, addr_list, composed)
            self.connection.quit()
            success = True
        except smtplib.SMTPRecipientsRefused, e:
            errmsg = 'recipients refused: '+', '.join(e.recipients.keys())
        except smtplib.SMTPSenderRefused, e:
            errmsg = 'sender refused: %s' % (e.sender, )
        except smtplib.SMTPException, e:
            errmsg = 'SMTP error: %s' % (e, )
        except Exception, e:
            errmsg = str(e)
        else:
            if ret:
                failed_addresses = ret.keys()
                errmsg = 'recipients refused: '+', '.join(failed_addresses)
        finally:
            print errmsg
            return {
                'success': success,
                'errmsg': errmsg
            }

    def reconnect(self):
        self.__init__()
