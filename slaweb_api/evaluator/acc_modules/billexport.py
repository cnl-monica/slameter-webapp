# -*- coding: utf-8 -*-
from __future__ import unicode_literals
from __future__ import division
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
from django.http import HttpResponse
from reportlab.platypus.doctemplate import SimpleDocTemplate
from reportlab.platypus.flowables import Image, HRFlowable
from reportlab.platypus import Paragraph, Spacer, PageBreak
from reportlab.platypus.tables import Table

from conversion_tools import data_size_of, data_per_sec_size_of
from accounting.models import AccCriteria, AccProvider, AccUser
import datetime
import time
import copy


# Header levels


H1, H2, H3, H4, H5, H6 = 1, 2, 3, 4, 5, 6

# List styles
UL, OL = 0, 1

# Alignment
CENTER, LEFT, RIGHT = 'CENTER', 'LEFT', 'RIGHT'


def createBill(accUserID, timeFrom, timeTo, type, invoice_data):
    User = AccUser.objects.get(pk=int(accUserID))
    accProvider = AccProvider.objects.get(id=1)
    criteria = AccCriteria.objects.all().filter(user=User).order_by('priority')

    user = User

    userdict = {
        'name': user.name,
        'organization': user.organization,
        'phone': user.phone,
        'mobile': user.mobile,
        'email': user.email,
        'ip_addresses': user.ip_addresses,
        'ico': user.ico,
        'dic': user.dic,
        'account_no': user.accountNo
    }

    # response = HttpResponse(content_type='application/pdf')

    addressfields = [
        accProvider.address_street_name + ' ' + accProvider.address_street_number,
        accProvider.address_zip_code + ' ' + accProvider.address_city,
        accProvider.address_country]

    providerdict = {
        'contact_number': accProvider.contact_number,
        'email': accProvider.email,
        'ico': accProvider.ico,
        'dic': accProvider.dic,
        'account_no': accProvider.accountNo
    }


    today = datetime.date.today()
    datestr = "%s.%s.%s" % (today.day, today.month, today.year)
    localtime = time.localtime(time.time())
    timestr = time.strftime('%H:%M:%S', localtime)

    factureid = str(today.day)+str(today.month)+str(today.year)+time.strftime('%H', localtime)+time.strftime('%M', localtime)+time.strftime('%S', localtime)+str(accUserID)

    dictfacture = {
        'date': datestr,
        'time': timestr,
        'id': factureid,
        'clientid': accUserID
    }

    TABLE_WIDTH = 535.35

    class MyTheme(DefaultTheme):
        doc = {
            'leftMargin': 25,
            'rightMargin': 25,
            'topMargin': 20,
            'bottomMargin': 25,
            'allowSplitting': False
        }

    doc = Pdf()
    doc.set_theme(MyTheme)
    """
    if len(str(accProvider.photo)) != 0:
        try:
            image = Image(str(accProvider.photo), 180, 67)
        except IOError:
            image = None
    else:
        image = None
    """
    image = None
    style = getSampleStyleSheet()
    normal = style["Normal"]
    normal1 = copy.deepcopy(style["Normal"])
    normal1.textColor = colors.darkviolet

    normal2 = copy.deepcopy(normal)
    normal2.alignment = TA_RIGHT
    normal2.fontSize = 25
    normal2.leading = 15
    normal2.textColor = colors.grey
    normal2.rightIndent = 60

    normal3 = copy.deepcopy(normal)
    normal3.fontSize = 20
    normal3.fontName = 'Times-Bold'
    normal3.leading = 15

    normal4 = copy.deepcopy(normal)
    normal4.backColor = colors.HexColor('#C0C0C0')
    normal4.fontName = 'Times-Bold'
    normal4.leading = 15
    normal4.fontSize = 12

    normal5 = copy.deepcopy(normal)
    normal5.leftIndent = 15

    normal6 = copy.deepcopy(normal5)
    normal6.fontSize = 25

    normal7 = copy.deepcopy(normal5)
    normal7.fontSize = 8

    invoiceword = Paragraph("Invoice", normal2)


    right1 = []
    left1 = []

    right1.append(invoiceword)

    factureidentification = Paragraph("""
    <para align=right leading=15 >
    <font size=16>
            <br/><br/><br/><b>    DATE:<br/>    TIME:<br/>    INVOICE # :<br/>    CLIENT ID:</b>
    </para>
            """, normal)

    facturevalues = Paragraph("""
    <para align=right leading=15>
    <font size=16>
            <br/><br/><br/>
            <b>    %(date)s</b><br/>
            <b>    %(time)s</b><br/>
            <b>    %(id)s</b><br/>
            <b>    %(clientid)s</b>
    </para>
            """ % dictfacture, normal1)
    space = Spacer(1, 0.25 * inch)
    tab2 = Table([[factureidentification, facturevalues]], style=[('VALIGN', (0, 0), (-1, -1), 'TOP')])

    right1.append(tab2)
    right1.append(Spacer(1, 0.25 * inch))
    if image is not None:
        left1.append(image)

    providernameword = Paragraph(accProvider.name, normal3)
    left1.append(providernameword)
    left1.append(Spacer(1, 0.25 * inch))
    for ad in addressfields:
        left1.append(Paragraph(ad, normal))

    providerfields = Paragraph("""
            Contact Number:    %(contact_number)s<br/>E-mail:    %(email)s<br/>ICO:    %(ico)s<br/>DIC:    %(dic)s<br/><b>Account Number:    %(account_no)s</b>
            """ % providerdict, normal)
    left1.append(Spacer(1, 0.25 * inch))
    left1.append(providerfields)
    left1.append(Spacer(1, 0.125 * inch))
    left1.append(Paragraph("Invoice for Billing Period", style['Heading2']))
    left1.append(Paragraph("<b>%s - %s</b>" % (timeFrom, timeTo), normal5))
    left1.append(Spacer(1, 0.25 * inch))
    if type == 'criteria' and invoice_data['two_tariff']:
        left1.append(Paragraph("First and Second Time Tariff Intervals", style['Heading2']))
        left1.append(Paragraph("<b>1st: %s<br/>2nd: %s</b>" % (invoice_data['hour_from_to'], invoice_data['hour_to_from']), normal5))
    else:
        if type != 'criteria':
            left1.append(Paragraph("Calculation type", style['Heading2']))
            left1.append(Paragraph("<b>%s</b>" % (invoice_data['calc_type']['label']), normal5))
            left1.append(Paragraph("<br />* %s" % (invoice_data['calc_type']['desc']), normal7))




    right1.append(Paragraph("""&nbsp;    Bill to Entity:""", normal4))
    right1.append(Spacer(1, 0.125 * inch))

    right1.append(Spacer(1, 0.125 * inch))

    right1.append(Paragraph("""
    <p>
    <b>%(name)s<br/>%(organization)s</b>
    </p>
    """ % userdict, normal5))
    right1.append(Spacer(1, 0.125 * inch))

    right1.append(Spacer(1, 0.125 * inch))

    addressfields = [
        user.address_street_name + ' ' + user.address_street_number,
        user.address_zip_code + ' ' + user.address_city,
        user.address_country]

    for ad in addressfields:
        if len(ad.strip()) != 0:
            right1.append(Paragraph(ad, normal5))
    right1.append(Spacer(1, 0.125 * inch))
    right1.append(Paragraph("""
    <p>
    Phone Number %(phone)s<br/>
    Cell Phone: %(mobile)s<br/>
    E-mail: %(email)s<br/>
    Assigned IPv4 Addresses: %(ip_addresses)s<br/>ICO: %(ico)s<br/>
    DIC: %(dic)s<br/><b>Account Number:  %(account_no)s</b><br/>
    </p>
            """ % userdict, normal5))

    doc.add(Table([[left1, right1]], style=[('VALIGN', (0,0), (-1,-1), 'TOP')]))

    doc.add_spacer()

    normalRight = copy.deepcopy(normal)
    normalRight.alignment = TA_RIGHT

    H1Right = copy.deepcopy(style['Heading1'])
    H1Right.alignment = TA_RIGHT
    if type == 'criteria' and len(invoice_data['billing_data']) != 0:
        doc.add_header('Costs for user accounting criteria', H2)
        doc.add_table(get_billing_table_criteria(invoice_data['two_tariff'], invoice_data['billing_data']), TABLE_WIDTH)
    else:
        doc.add_header("Costs and tariffs for network usage based on %s" % str(type), H2)
        leftcol = []
        rightcol = []
        if type == 'speed':
            bd = str(data_per_sec_size_of(long(invoice_data['tariff_costs']['base_data'])))
            if 'additional_data' in invoice_data['tariff_costs'] and str(invoice_data['tariff_costs']['additional_data']) != '':
                ad = str(data_per_sec_size_of(long(invoice_data['tariff_costs']['additional_data'])))
            sd = '95th Percentile'
            sum_value = str(data_per_sec_size_of(long(invoice_data['result_data'])))
        else:
            bd = str(data_size_of(long(invoice_data['tariff_costs']['base_data'])))
            if 'additional_data' in invoice_data['tariff_costs'] and str(invoice_data['tariff_costs']['additional_data']) != '':
                ad = str(data_size_of(long(invoice_data['tariff_costs']['additional_data'])))
            sd = (invoice_data['calc_type']['label']) + ' data'
            sum_value = str(data_size_of(long(invoice_data['total_data'])))

        leftcol.append(Paragraph("<b>Base %s </b>" % str(type), style['Normal']))
        leftcol.append(Spacer(1, 0.125 * inch))
        leftcol.append(Paragraph("<b>Base cost</b>", style['Normal']))
        leftcol.append(Spacer(1, 0.125 * inch))

        if 'additional_data' in invoice_data['tariff_costs'] and str(invoice_data['tariff_costs']['additional_data']) != '':
            leftcol.append(Paragraph("<b>Additional %s </b>" % str(type), style['Normal']))
            leftcol.append(Spacer(1, 0.125 * inch))
            leftcol.append(Paragraph("<b>Additional cost</b>", style['Normal']))
            leftcol.append(Spacer(1, 0.125 * inch))

        leftcol.append(Paragraph("<b>%s</b>" % sd, style['Normal']))
        leftcol.append(Spacer(1, 0.125 * inch))

        rightcol.append(Paragraph("%s" % str(bd), normalRight))
        rightcol.append(Spacer(1, 0.125 * inch))
        rightcol.append(Paragraph("%s €" % (str(invoice_data['tariff_costs']['base_cost'])), normalRight))
        rightcol.append(Spacer(1, 0.125 * inch))
        if 'additional_data' in invoice_data['tariff_costs'] and str(invoice_data['tariff_costs']['additional_data']) != '':
            rightcol.append(Paragraph("%s" % str(ad), normalRight))
            rightcol.append(Spacer(1, 0.125 * inch))
            rightcol.append(Paragraph("%s €" % (str(invoice_data['tariff_costs']['additional_cost'])), normalRight))
            rightcol.append(Spacer(1, 0.125 * inch))
        rightcol.append(Paragraph("%s" % str(sum_value), normalRight))
        leftcol.append(Spacer(1, 0.125 * inch))

        doc.add(Table([[leftcol, rightcol]], style=[('VALIGN', (0, 0), (-1, -1), 'TOP')]))


    doc.add(HRFlowable(color=colors.black, thickness=0.8, width="100%"))
    doc.add(HRFlowable(color=colors.black, thickness=0.8, width="100%"))

    leftcol = []
    rightcol = []
    ts = float(invoice_data['total_sum'])
    tx = float('0.'+accProvider.tax)
    tax = round(ts*tx, 2)
    pst = accProvider.tax + '%'
    leftcol.append(Paragraph("<b>Subtotal</b>", style['Normal']))
    leftcol.append(Paragraph("<b>Tax %s</b>" % (pst), style['Normal']))
    rightcol.append(Paragraph("%s" % (str(invoice_data['total_sum'])), normalRight))
    rightcol.append(Paragraph("%s" % (str(tax)), normalRight))

    doc.add(Table([[leftcol, rightcol]], style=[('VALIGN', (0, 0), (-1, -1), 'TOP')]))

    totalsumWithTax = round(ts+tax, 2)




    ta = "Total with Tax"
    leftcol2 = Paragraph(ta, style['Heading1'])
    rightcol2 = Paragraph("%s €" % (str(totalsumWithTax)), H1Right)

    doc.add(HRFlowable(color=colors.black, thickness=0.8, width="100%"))
    doc.add(HRFlowable(color=colors.black, thickness=0.8, width="100%"))

    doc.add(Table([[leftcol2, rightcol2]], style=[('VALIGN', (0,0), (-1,-1), 'TOP')]))

    if type == 'criteria' and len(invoice_data['billing_data']) != 0:
        doc.add(PageBreak())
        doc.add_header("Accounting Criteria Details", H1)
        doc.add_spacer(1)

        doc.add_header("User Criteria", H2)
        doc.add_spacer(1)
        data = getCriteriaInfoTable(criteria)
        doc.add_table(data[0], TABLE_WIDTH)
        doc.add(Spacer(1, 0.25 * inch))
        doc.add_table(data[1], TABLE_WIDTH)
    if type == 'speed':
        doc.add_spacer()
        doc.add_header("Network usage details", H2)
        doc.add_table(get_billing_table_speed(invoice_data), TABLE_WIDTH)
    return HttpResponse(doc.render(HttpResponse(content_type='application/pdf'), 'invoice', 'SLAmeter'), content_type='application/pdf')


class DefaultTheme(object):

    _s = getSampleStyleSheet()
    filename = 'Invoice'
    doc = {
        'leftMargin': None,
        'rightMargin': None,
        'topMargin': None,
        'bottomMargin': None
    }

    headers = {
        H1: _s['Heading1'],
        H2: _s['Heading2'],
        H3: _s['Heading3']
        }

    paragraph = _s['Normal']
    spacer_height = 0.25 * inch

    table_style = [
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONT', (0,0), (-1,0), 'Helvetica-Bold'),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#C0C0C0')),
        ('ROWBACKGROUNDS', (0,1), (-1, -1), [colors.white, colors.HexColor('#E0E0E0')])
    ]

    @classmethod
    def doc_template_args(cls):
        return dict([(k, v) for k, v in cls.doc.items() if v is not None])

    @classmethod
    def header_for_level(cls, level):
        return cls.headers[level]

    def __new__(cls, *args, **kwargs):
        raise TypeError("Theme classes may not be instantiated.")


def calc_table_col_widths(rows, table_width):
    max_chars_per_col = [0] * len(rows[0])
    for row in rows:
        for idx, col in enumerate(row):
            for line in str(col).split('\n'):
                max_chars_per_col[idx] = max(len(line),
                    max_chars_per_col[idx])
    sum_chars = sum(max_chars_per_col)
    return [(x * table_width / sum_chars) for x in max_chars_per_col]


class Pdf(object):

    story = []
    theme = DefaultTheme

    def __init__(self):
        self.title = 'Invoice'
        self.author = 'SLAmeter'

    def set_theme(self, theme):
        self.theme = theme

    def add(self, flowable):
        self.story.append(flowable)

    def add_header(self, text, level=H1):
        p = Paragraph(text, self.theme.header_for_level(level))
        self.add(p)

    def get_header(self, text, level=H1):
        p = Paragraph(text, self.theme.header_for_level(level))
        return p

    def add_spacer(self, height_inch=None):
        height_inch = height_inch or self.theme.spacer_height
        self.add(Spacer(1, height_inch))

    def add_table(self, rows, width=None, col_widths=None, align=CENTER,
                  extra_style=[]):
        style = self.theme.table_style + extra_style
        if width and col_widths is None: # one cannot spec table width in rLab only col widths
            col_widths = calc_table_col_widths(rows, width) # this helper calcs it for us
        table = Table(rows, col_widths, style=style, hAlign=align)
        self.add(table)

    def render(self, response, title, author):
        doc_template_args = self.theme.doc_template_args()
        doc = SimpleDocTemplate(response, title=title, author=author,
            **doc_template_args)
        doc.build(self.story)

        return response


def getCriteriaInfoTable(criteria):

    criteriaInfTable1 = [['Criterium ID', 'Priority', 'Protocol', 'Source Ports', 'Destination Ports', 'DSCP   ', 'Multicast']]

    for criterium in criteria:
        if criterium.multicast:
            multicast = 'Only Multicast'
        else:
            multicast = 'Any'
        criteriaInfTable1.append([str(criterium.id), str(criterium.priority), str(criterium.protocol), str(criterium.sourcePorts), str(criterium.destinationPorts), str(criterium.dscp), multicast])

    criteriaInfTable2 = [['Criterium ID', 'Source IPv4 Addresses', 'Destination IPv4 Addresses']]

    for criterium in criteria:
        criteriaInfTable2.append([str(criterium.id), criterium.sourceIpAddresses, criterium.destinationIpAddresses])

    return [criteriaInfTable1, criteriaInfTable2]


def get_billing_table_criteria(twoTariff, billing_data):

    if twoTariff:
        criteriaCostTable = [['Criterium ID', 'Data For 1st Tariff', 'Data For 2nd Tariff', '1st Tariff', '2nd Tariff', 'Sum(EUR)  ']]

        for billingrecord in billing_data:

            criteriaCostTable.append([billingrecord["criterium_id"],
                                      data_size_of(billingrecord["data_st_rate"]),
                                      data_size_of(billingrecord["data_wt_rate"]),
                                      str(billingrecord["st_rate"]) + " Eur for " + data_size_of(float(billingrecord["st_rate_data_unit"])),
                                      str(billingrecord["wt_rate"]) + " Eur for " + data_size_of(float(billingrecord["wt_rate_data_unit"])),
                                      billingrecord["sum"]])
    else:
        criteriaCostTable = [['Criterium ID', 'Data Volume', 'Tariff', 'Costs per Criterium in EUR']]

        for billingrecord in billing_data:
            criteriaCostTable.append([billingrecord["criterium_id"], data_size_of(billingrecord["data_st_rate"]), str(billingrecord["st_rate"]) + " Eur for " + data_size_of(float(billingrecord["st_rate_data_unit"])), billingrecord["sum"]])

    return criteriaCostTable


# Zaokruhli AVG
def get_billing_table_speed(data):
    speed_cost_table = [['Category', 'Total', 'Min', 'Avg', 'Max']]
    speed_cost_table.append(['Download - In',
                             str(data_size_of(long(data['billing_data']['download']['download_total_bytes']))),
                             str(data_per_sec_size_of(long(data['billing_data']['download']['min_download_bps']))),
                             str(data_per_sec_size_of(long(data['billing_data']['download']['avg_download_bps']))),
                             str(data_per_sec_size_of(long(data['billing_data']['download']['max_download_bps'])))])
    speed_cost_table.append(['Upload - Out',
                             str(data_size_of(long(data['billing_data']['upload']['upload_total_bytes']))),
                             str(data_per_sec_size_of(long(data['billing_data']['upload']['min_upload_bps']))),
                             str(data_per_sec_size_of(long(data['billing_data']['upload']['avg_upload_bps']))),
                             str(data_per_sec_size_of(long(data['billing_data']['upload']['max_upload_bps'])))])
    return speed_cost_table

