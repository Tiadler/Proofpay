import crypto from 'node:crypto';

function txHash(prefix = 'rialo_mock_tx') {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

export class MockRialoAdapter {
  constructor({ rpcUrl = process.env.RIALO_RPC_URL || null } = {}) {
    this.rpcUrl = rpcUrl;
    this.mode = 'mock';
  }

  async getNetworkInfo() {
    const info = {
      mode: this.mode,
      note: 'Mock adapter. Replace with rialo-cdk/Rust microservice for real devnet invocation.'
    };
    if (this.rpcUrl) info.rpcUrl = this.rpcUrl;
    return info;
  }

  async createEscrowAccount(deal) {
    return {
      escrowAccount: `rialo_escrow_${deal.id}`,
      programId: 'proofpay_escrow_program_mock',
      txHash: txHash('create_escrow')
    };
  }

  async fundEscrow(deal) {
    return {
      txHash: txHash('fund'),
      amount: deal.amount,
      tokenSymbol: deal.tokenSymbol,
      status: 'FUNDED'
    };
  }

  async releasePayment(deal) {
    return {
      txHash: txHash('release'),
      to: deal.payeeAddress,
      amount: deal.amount,
      tokenSymbol: deal.tokenSymbol,
      status: 'RELEASED'
    };
  }

  async refundPayment(deal) {
    return {
      txHash: txHash('refund'),
      to: deal.payerAddress,
      amount: deal.amount,
      tokenSymbol: deal.tokenSymbol,
      status: 'REFUNDED'
    };
  }

  async submitProofHash(deal, proofHash) {
    return {
      txHash: txHash('proof'),
      dealId: deal.id,
      proofHash
    };
  }
}

export const rialoAdapter = new MockRialoAdapter();
