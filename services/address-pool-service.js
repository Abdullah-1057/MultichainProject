const { Pool } = require("pg")

class AddressPoolService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  }

  async storeAddress(chain, address, privateKey, derivationIndex) {
    try {
      const query = `
        INSERT INTO address_pools (chain, address, private_key_encrypted, derivation_index, is_used)
        VALUES ($1, $2, $3, $4, false)
        RETURNING id
      `
      const values = [chain, address, privateKey, derivationIndex]
      const result = await this.pool.query(query, values)
      return result.rows[0].id
    } catch (error) {
      console.error("Failed to store address:", error)
      throw error
    }
  }

  async markAddressAsUsed(address, fundingId) {
    try {
      const query = `
        UPDATE address_pools 
        SET is_used = true, used_at = NOW()
        WHERE address = $1
      `
      await this.pool.query(query, [address])
    } catch (error) {
      console.error("Failed to mark address as used:", error)
      throw error
    }
  }

  async getUnusedAddress(chain) {
    try {
      const query = `
        SELECT address, private_key_encrypted, derivation_index
        FROM address_pools
        WHERE chain = $1 AND is_used = false
        ORDER BY created_at ASC
        LIMIT 1
      `
      const result = await this.pool.query(query, [chain])
      return result.rows[0] || null
    } catch (error) {
      console.error("Failed to get unused address:", error)
      return null
    }
  }

  async preGenerateAddresses(chain, count = 10) {
    try {
      const BTCService = require("./btc-service")
      const ETHService = require("./eth-service")
      const SOLService = require("./sol-service")

      let service
      switch (chain) {
        case "BTC":
          service = new BTCService()
          break
        case "ETH":
          service = new ETHService()
          break
        case "SOL":
          service = new SOLService()
          break
        default:
          throw new Error(`Unsupported chain: ${chain}`)
      }

      const addresses = []
      for (let i = 0; i < count; i++) {
        const addressData = await service.generateAddress()
        await this.storeAddress(chain, addressData.address, addressData.privateKey, addressData.derivationIndex)
        addresses.push(addressData.address)
      }

      console.log(`Pre-generated ${count} ${chain} addresses`)
      return addresses
    } catch (error) {
      console.error(`Failed to pre-generate ${chain} addresses:`, error)
      throw error
    }
  }
}

module.exports = AddressPoolService
