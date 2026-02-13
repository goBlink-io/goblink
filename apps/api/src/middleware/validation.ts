import { Request, Response, NextFunction } from 'express';

export const validateQuoteRequest = (req: Request, res: Response, next: NextFunction) => {
  const { originAsset, destinationAsset, amount, recipient, refundTo } = req.body;

  if (!originAsset || !destinationAsset || !amount || !recipient || !refundTo) {
    return res.status(400).json({ 
      error: 'Missing required fields: originAsset, destinationAsset, amount, recipient, refundTo' 
    });
  }

  // Basic format validation could go here
  
  next();
};
