const Invoice = require('../models/Invoice');
const Visit = require('../models/Visit');
const User = require('../models/User');
const Pool = require('../models/Pool');

// @desc    Create invoice for a visit
// @route   POST /api/invoices
// @access  Private (Admin only)
exports.createInvoice = async (req, res, next) => {
  try {
    const { visitId, items, tax, dueDate, notes } = req.body;

    // Check if visit exists and is completed
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    if (visit.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only create invoice for completed visits'
      });
    }

    // Check if invoice already exists for this visit
    const existingInvoice = await Invoice.findOne({ visit: visitId });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this visit'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const total = subtotal + (tax || 0);

    // Create invoice
    const invoice = await Invoice.create({
      client: visit.client,
      pool: visit.pool,
      visit: visitId,
      items,
      tax: tax || 0,
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes,
      technician: visit.assignedTechnician
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res, next) => {
  try {
    const { status, clientId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by client (for regular users, only show their invoices)
    if (req.user.role === 'user') {
      query.client = req.user.id;
    } else if (clientId) {
      query.client = clientId;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'client', select: 'name email' },
        { path: 'pool', select: 'name address' },
        { path: 'visit', select: 'reason scheduledDate' },
        { path: 'technician', select: 'name' }
      ],
      sort: { createdAt: -1 }
    };
    
    const invoices = await Invoice.paginate(query, options);
    
    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('pool', 'name address')
      .populate('visit', 'reason scheduledDate completedAt')
      .populate('technician', 'name');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Check authorization
    if (req.user.role === 'user' && invoice.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this invoice'
      });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private (Admin only)
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // Update status
    invoice.status = status;
    
    // If marking as paid, set payment details
    if (status === 'paid') {
      invoice.paidDate = new Date();
      invoice.paymentMethod = paymentMethod;
    }
    
    await invoice.save();
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private (Admin only)
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const stats = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);
    
    const totalInvoices = await Invoice.countDocuments(query);
    const totalRevenue = await Invoice.aggregate([
      { $match: { ...query, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        stats,
        totalInvoices,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send invoice reminder
// @route   POST /api/invoices/:id/remind
// @access  Private (Admin only)
exports.sendInvoiceReminder = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name email phone');
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    
    // In a real app, send email/SMS reminder here
    console.log(`Sending reminder for invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Invoice reminder sent successfully'
    });
  } catch (error) {
    next(error);
  }
}; 