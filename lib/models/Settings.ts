import mongoose, { Document, Schema } from "mongoose"

export interface ISettings extends Document {
  site: {
    name: string
    description: string
    logo: string
    favicon: string
    contactEmail: string
    contactPhone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    socialLinks: {
      facebook?: string
      twitter?: string
      instagram?: string
      linkedin?: string
      youtube?: string
    }
  }
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
    ogImage: string
    twitterCard: string
  }
  homepage: {
    heroSlider: {
      id: string
      title: string
      subtitle: string
      image: string
      buttonText: string
      buttonLink: string
      order: number
      isActive: boolean
    }[]
    categoryShowcase: {
      categoryId: mongoose.Types.ObjectId
      order: number
      isActive: boolean
    }[]
    featuredProducts: {
      productIds: mongoose.Types.ObjectId[]
      title: string
      showAllButton: boolean
    }
    trendingProducts: {
      productIds: mongoose.Types.ObjectId[]
      title: string
      showAllButton: boolean
    }
  }
  footer: {
    content: {
      about: string
      quickLinks: {
        title: string
        links: {
          text: string
          url: string
        }[]
      }[]
      customerService: {
        title: string
        links: {
          text: string
          url: string
        }[]
      }[]
    }
    copyright: string
    paymentMethods: string[]
  }
  shipping: {
    freeShippingThreshold: number
    standardShippingCost: number
    expressShippingCost: number
    estimatedDelivery: {
      standard: string
      express: string
    }
  }
  payment: {
    methods: ('cod')[]
    cod: {
      instructions: string
    }
  }
  taxes: {
    enabled: boolean
    rate: number
    includedInPrice: boolean
  }
  currency: {
    code: string
    symbol: string
    position: 'before' | 'after'
  }
  email: {
    fromName: string
    fromEmail: string
    templates: {
      orderConfirmation: {
        subject: string
        body: string
      }
      orderShipped: {
        subject: string
        body: string
      }
      orderDelivered: {
        subject: string
        body: string
      }
    }
  }
  updatedAt: Date
}

const SettingsSchema = new Schema<ISettings>({
  site: {
    name: {
      type: String,
      required: true,
      default: "Premium E-Commerce"
    },
    description: String,
    logo: String,
    favicon: String,
    contactEmail: String,
    contactPhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String,
    twitterCard: {
      type: String,
      default: 'summary_large_image'
    }
  },
  homepage: {
    heroSlider: [{
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      subtitle: String,
      image: {
        type: String,
        required: true
      },
      buttonText: String,
      buttonLink: String,
      order: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    categoryShowcase: [{
      categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
      },
      order: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    featuredProducts: {
      productIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
      }],
      title: String,
      showAllButton: {
        type: Boolean,
        default: true
      }
    },
    trendingProducts: {
      productIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
      }],
      title: String,
      showAllButton: {
        type: Boolean,
        default: true
      }
    }
  },
  footer: {
    content: {
      about: String,
      quickLinks: [{
        title: String,
        links: [{
          text: String,
          url: String
        }]
      }],
      customerService: [{
        title: String,
        links: [{
          text: String,
          url: String
        }]
      }]
    },
    copyright: String,
    paymentMethods: [String]
  },
  shipping: {
    freeShippingThreshold: {
      type: Number,
      default: 0
    },
    standardShippingCost: {
      type: Number,
      default: 0
    },
    expressShippingCost: {
      type: Number,
      default: 0
    },
    estimatedDelivery: {
      standard: {
        type: String,
        default: "3-5 business days"
      },
      express: {
        type: String,
        default: "1-2 business days"
      }
    }
  },
  payment: {
    methods: [{
      type: String,
      enum: ['cod']
    }],
    cod: {
      instructions: String
    }
  },
  taxes: {
    enabled: {
      type: Boolean,
      default: false
    },
    rate: {
      type: Number,
      default: 0
    },
    includedInPrice: {
      type: Boolean,
      default: true
    }
  },
  currency: {
    code: {
      type: String,
      default: "USD"
    },
    symbol: {
      type: String,
      default: "$"
    },
    position: {
      type: String,
      enum: ['before', 'after'],
      default: 'before'
    }
  },
  email: {
    fromName: String,
    fromEmail: String,
    templates: {
      orderConfirmation: {
        subject: String,
        body: String
      },
      orderShipped: {
        subject: String,
        body: String
      },
      orderDelivered: {
        subject: String,
        body: String
      }
    }
  }
}, {
  timestamps: true
})

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema)