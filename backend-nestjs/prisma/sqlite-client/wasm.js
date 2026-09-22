
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  slug: 'slug',
  image: 'image',
  icon: 'icon',
  order: 'order',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  parentId: 'parentId'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  specifications: 'specifications',
  price: 'price',
  comparePrice: 'comparePrice',
  cost: 'cost',
  stock: 'stock',
  minStock: 'minStock',
  sku: 'sku',
  barcode: 'barcode',
  brand: 'brand',
  model: 'model',
  weight: 'weight',
  dimensions: 'dimensions',
  warranty: 'warranty',
  origin: 'origin',
  active: 'active',
  featured: 'featured',
  hasVariations: 'hasVariations',
  isVariation: 'isVariation',
  rating: 'rating',
  reviewCount: 'reviewCount',
  viewCount: 'viewCount',
  saleCount: 'saleCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  categoryId: 'categoryId',
  parentProductId: 'parentProductId'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  url: 'url',
  alt: 'alt',
  order: 'order',
  createdAt: 'createdAt',
  productId: 'productId'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  createdAt: 'createdAt'
};

exports.Prisma.ProductTagScalarFieldEnum = {
  productId: 'productId',
  tagId: 'tagId'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  productId: 'productId'
};

exports.Prisma.OrderScalarFieldEnum = {
  id: 'id',
  orderNumber: 'orderNumber',
  status: 'status',
  total: 'total',
  subtotal: 'subtotal',
  shipping: 'shipping',
  tax: 'tax',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId'
};

exports.Prisma.OrderItemScalarFieldEnum = {
  id: 'id',
  quantity: 'quantity',
  price: 'price',
  total: 'total',
  orderId: 'orderId',
  productId: 'productId'
};

exports.Prisma.ShippingAddressScalarFieldEnum = {
  id: 'id',
  street: 'street',
  number: 'number',
  complement: 'complement',
  district: 'district',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  country: 'country',
  orderId: 'orderId'
};

exports.Prisma.PaymentScalarFieldEnum = {
  id: 'id',
  method: 'method',
  status: 'status',
  amount: 'amount',
  transactionId: 'transactionId',
  paidAt: 'paidAt',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  orderId: 'orderId'
};

exports.Prisma.AttributeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  required: 'required',
  order: 'order',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttributeOptionScalarFieldEnum = {
  id: 'id',
  value: 'value',
  label: 'label',
  color: 'color',
  order: 'order',
  active: 'active',
  createdAt: 'createdAt',
  attributeId: 'attributeId'
};

exports.Prisma.ProductAttributeScalarFieldEnum = {
  id: 'id',
  value: 'value',
  createdAt: 'createdAt',
  productId: 'productId',
  attributeId: 'attributeId',
  optionId: 'optionId'
};

exports.Prisma.VariationTypeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  order: 'order',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.VariationOptionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  value: 'value',
  color: 'color',
  order: 'order',
  active: 'active',
  createdAt: 'createdAt',
  typeId: 'typeId'
};

exports.Prisma.ProductVariationOptionScalarFieldEnum = {
  id: 'id',
  createdAt: 'createdAt',
  productId: 'productId',
  optionId: 'optionId'
};

exports.Prisma.ProductReviewScalarFieldEnum = {
  id: 'id',
  rating: 'rating',
  title: 'title',
  comment: 'comment',
  verified: 'verified',
  helpful: 'helpful',
  notHelpful: 'notHelpful',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  productId: 'productId',
  userId: 'userId'
};

exports.Prisma.ProductRelationScalarFieldEnum = {
  id: 'id',
  type: 'type',
  order: 'order',
  createdAt: 'createdAt',
  fromProductId: 'fromProductId',
  toProductId: 'toProductId'
};

exports.Prisma.SettingScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  type: 'type',
  category: 'category',
  label: 'label',
  description: 'description',
  required: 'required',
  encrypted: 'encrypted',
  order: 'order',
  active: 'active',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  sessionId: 'sessionId',
  userId: 'userId',
  channel: 'channel',
  status: 'status',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ConversationMessageScalarFieldEnum = {
  id: 'id',
  role: 'role',
  content: 'content',
  metadata: 'metadata',
  tokens: 'tokens',
  createdAt: 'createdAt',
  conversationId: 'conversationId'
};

exports.Prisma.AIUsageLogScalarFieldEnum = {
  id: 'id',
  provider: 'provider',
  model: 'model',
  operation: 'operation',
  tokens: 'tokens',
  cost: 'cost',
  userId: 'userId',
  sessionId: 'sessionId',
  success: 'success',
  error: 'error',
  createdAt: 'createdAt'
};

exports.Prisma.BannerScalarFieldEnum = {
  id: 'id',
  title: 'title',
  subtitle: 'subtitle',
  description: 'description',
  buttonText: 'buttonText',
  buttonLink: 'buttonLink',
  imageUrl: 'imageUrl',
  bgColor: 'bgColor',
  textColor: 'textColor',
  type: 'type',
  position: 'position',
  active: 'active',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SecurityLogScalarFieldEnum = {
  id: 'id',
  event: 'event',
  severity: 'severity',
  userId: 'userId',
  ip: 'ip',
  userAgent: 'userAgent',
  details: 'details',
  timestamp: 'timestamp',
  createdAt: 'createdAt'
};

exports.Prisma.PriceHistoryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  oldPrice: 'oldPrice',
  newPrice: 'newPrice',
  reason: 'reason',
  userId: 'userId',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  Category: 'Category',
  Product: 'Product',
  ProductImage: 'ProductImage',
  Tag: 'Tag',
  ProductTag: 'ProductTag',
  CartItem: 'CartItem',
  Order: 'Order',
  OrderItem: 'OrderItem',
  ShippingAddress: 'ShippingAddress',
  Payment: 'Payment',
  Attribute: 'Attribute',
  AttributeOption: 'AttributeOption',
  ProductAttribute: 'ProductAttribute',
  VariationType: 'VariationType',
  VariationOption: 'VariationOption',
  ProductVariationOption: 'ProductVariationOption',
  ProductReview: 'ProductReview',
  ProductRelation: 'ProductRelation',
  Setting: 'Setting',
  Conversation: 'Conversation',
  ConversationMessage: 'ConversationMessage',
  AIUsageLog: 'AIUsageLog',
  Banner: 'Banner',
  SecurityLog: 'SecurityLog',
  PriceHistory: 'PriceHistory'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
