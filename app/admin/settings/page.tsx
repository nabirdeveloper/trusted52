'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, Upload, X } from 'lucide-react';

interface Settings {
site: {
name: string;
description: string;
logo: string;
favicon: string;
contactEmail: string;
contactPhone: string;
address: {
street: string;
city: string;
state: string;
zipCode: string;
country: string;
};
socialLinks: {
facebook: string;
twitter: string;
instagram: string;
linkedin: string;
youtube: string;
};
};
seo: {
metaTitle: string;
metaDescription: string;
keywords: string;
ogImage: string;
twitterCard: string;
};
homepage: {
heroSlider: Array<{
id: string;
title: string;
subtitle: string;
image: string;
buttonText: string;
buttonLink: string;
order: number;
isActive: boolean;
}>;
featuredProducts: {
productIds: string[];
title: string;
showAllButton: boolean;
};
categoryShowcase: Array<{
categoryId: string;
order: number;
isActive: boolean;
}>;
trendingProducts: {
productIds: string[];
title: string;
showAllButton: boolean;
};
};
footer: {
content: {
about: string;
quickLinks: Array<{
title: string;
links: Array<{
text: string;
url: string;
}>;
}>;
customerService: Array<{
title: string;
links: Array<{
text: string;
url: string;
}>;
}>;
};
copyright: string;
paymentMethods: string[];
};
shipping: {
freeShippingThreshold: number;
standardShippingCost: number;
expressShippingCost: number;
estimatedDelivery: {
standard: string;
express: string;
};
};
payment: {
methods: string[];
cod: {
instructions: string;
};
};
taxes: {
enabled: boolean;
rate: number;
includedInPrice: boolean;
};
currency: {
code: string;
symbol: string;
position: 'before' | 'after';
};
email: {
fromName: string;
fromEmail: string;
templates: {
orderConfirmation: {
subject: string;
body: string;
};
orderShipped: {
subject: string;
body: string;
};
orderDelivered: {
subject: string;
body: string;
};
};
};
updatedAt: Date;
}

export default function SettingsPage() {
const { data: session, status } = useSession();
const router = useRouter();
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState<'site' | 'seo' | 'homepage' | 'shipping' | 'payment' | 'taxes' | 'currency' | 'email' | 'footer'>('site');
const [settings, setSettings] = useState<Settings>({
site: {
name: '',
description: '',
logo: '',
favicon: '',
contactEmail: '',
contactPhone: '',
address: {
street: '',
city: '',
state: '',
zipCode: '',
country: ''
},
socialLinks: {
facebook: '',
twitter: '',
instagram: '',
linkedin: '',
youtube: ''
}
},
seo: {
metaTitle: '',
metaDescription: '',
keywords: '',
ogImage: '',
twitterCard: 'summary_large_image'
},
homepage: {
heroSlider: [],
featuredProducts: {
productIds: [],
title: '',
showAllButton: true
},
categoryShowcase: [],
trendingProducts: {
productIds: [],
title: '',
showAllButton: true
}
},
footer: {
content: {
about: '',
quickLinks: [],
customerService: []
},
copyright: '',
paymentMethods: []
},
shipping: {
freeShippingThreshold: 0,
standardShippingCost: 0,
expressShippingCost: 0,
estimatedDelivery: {
standard: '3-5 business days',
express: '1-2 business days'
}
},
payment: {
methods: ['cod'],
cod: {
instructions: ''
}
},
taxes: {
enabled: false,
rate: 0,
includedInPrice: true
},
currency: {
code: 'USD',
symbol: '$',
position: 'before'
},
email: {
fromName: '',
fromEmail: '',
templates: {
orderConfirmation: {
subject: '',
body: ''
},
orderShipped: {
subject: '',
body: ''
},
orderDelivered: {
subject: '',
body: ''
}
}
},
updatedAt: new Date()
});

useEffect(() => {
if (status === 'loading') return;
if (!session || session.user?.role !== 'admin') {
router.push('/auth/admin-login');
return;
}
fetchSettings();
}, [session, status, router]);

const fetchSettings = async () => {
try {
const response = await fetch('/api/admin/settings');
if (!response.ok) throw new Error('Failed to fetch settings');
const data = await response.json();

// Merge fetched data with defaults to ensure all nested objects exist
setSettings(prev => ({
site: {
...prev.site,
...data.site,
address: { ...prev.site.address, ...data.site?.address },
socialLinks: { ...prev.site.socialLinks, ...data.site?.socialLinks }
},
seo: { ...prev.seo, ...data.seo },
homepage: {
heroSlider: data.homepage?.heroSlider || prev.homepage.heroSlider,
featuredProducts: { ...prev.homepage.featuredProducts, ...data.homepage?.featuredProducts },
categoryShowcase: data.homepage?.categoryShowcase || prev.homepage.categoryShowcase,
trendingProducts: { ...prev.homepage.trendingProducts, ...data.homepage?.trendingProducts }
},
footer: {
...prev.footer,
...data.footer,
content: {
...prev.footer.content,
...data.footer?.content,
quickLinks: data.footer?.content?.quickLinks || prev.footer.content.quickLinks,
customerService: data.footer?.content?.customerService || prev.footer.content.customerService
}
},
shipping: { ...prev.shipping, ...data.shipping },
payment: { ...prev.payment, ...data.payment },
taxes: { ...prev.taxes, ...data.taxes },
currency: { ...prev.currency, ...data.currency },
email: {
...prev.email,
...data.email,
templates: {
orderConfirmation: { ...prev.email.templates.orderConfirmation, ...data.email?.templates?.orderConfirmation },
orderShipped: { ...prev.email.templates.orderShipped, ...data.email?.templates?.orderShipped },
orderDelivered: { ...prev.email.templates.orderDelivered, ...data.email?.templates?.orderDelivered }
}
},
updatedAt: data.updatedAt || new Date()
}));
} catch (error) {
console.error('Error fetching settings:', error);
}
};

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
const file = e.target.files?.[0];
if (!file) return;

setLoading(true);
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'settings');

try {
const response = await fetch('/api/admin/upload', {
method: 'POST',
body: formData
});

if (!response.ok) throw new Error('Failed to upload image');
const result = await response.json();

// Update the appropriate field based on the field name
if (field.includes('logo')) {
setSettings(prev => ({
...prev,
site: { ...prev.site, logo: result.secure_url }
}));
} else if (field.includes('favicon')) {
setSettings(prev => ({
...prev,
site: { ...prev.site, favicon: result.secure_url }
}));
} else if (field.includes('og')) {
setSettings(prev => ({
...prev,
seo: { ...prev.seo, ogImage: result.secure_url }
}));
}
} catch (error) {
console.error('Error uploading image:', error);
alert('Failed to upload image');
} finally {
setLoading(false);
}
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setLoading(true);

try {
const response = await fetch('/api/admin/settings', {
method: 'PUT',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify(settings)
});

if (!response.ok) throw new Error('Failed to save settings');

alert('Settings saved successfully!');
} catch (error) {
console.error('Error saving settings:', error);
alert('Failed to save settings');
} finally {
setLoading(false);
}
};

if (status === 'loading') {
return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

return (
<div className="container mx-auto px-4 py-8">
<div className="flex justify-between items-center mb-8">
<h1 className="text-3xl font-bold">Settings Management</h1>
</div>

{/* Tab Navigation */}
<div className="flex gap-2 mb-6 border-b flex-wrap">
{(['site', 'seo', 'homepage', 'shipping', 'payment', 'taxes', 'currency', 'email', 'footer'] as const).map((tab) => (
<Button
key={tab}
variant={activeTab === tab ? 'default' : 'ghost'}
onClick={() => setActiveTab(tab)}
className="capitalize"
>
{tab}
</Button>
))}
</div>

<form onSubmit={handleSubmit}>
{/* Site Settings */}
{activeTab === 'site' && (
<Card>
<CardHeader>
<CardTitle>Site Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label htmlFor="siteName">Site Name</Label>
<Input
id="siteName"
value={settings.site.name}
onChange={(e) => setSettings(prev => ({
...prev,
site: { ...prev.site, name: e.target.value }
}))}
/>
</div>
<div>
<Label htmlFor="contactEmail">Contact Email</Label>
<Input
id="contactEmail"
type="email"
value={settings.site.contactEmail}
onChange={(e) => setSettings(prev => ({
...prev,
site: { ...prev.site, contactEmail: e.target.value }
}))}
/>
</div>
</div>

<div>
<Label htmlFor="siteDescription">Site Description</Label>
<textarea
id="siteDescription"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={3}
value={settings.site.description}
onChange={(e) => setSettings(prev => ({
...prev,
site: { ...prev.site, description: e.target.value }
}))}
/>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label htmlFor="contactPhone">Contact Phone</Label>
<Input
id="contactPhone"
value={settings.site.contactPhone}
onChange={(e) => setSettings(prev => ({
...prev,
site: { ...prev.site, contactPhone: e.target.value }
}))}
/>
</div>
</div>

<div>
<h3 className="text-lg font-semibold mb-3">Address</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label htmlFor="street">Street</Label>
<Input
id="street"
value={settings.site.address.street}
onChange={(e) => setSettings(prev => ({
...prev,
site: {
...prev.site,
address: { ...prev.site.address, street: e.target.value }
}
}))}
/>
</div>
<div>
<Label htmlFor="city">City</Label>
<Input
id="city"
value={settings.site.address.city}
onChange={(e) => setSettings(prev => ({
...prev,
site: {
...prev.site,
address: { ...prev.site.address, city: e.target.value }
}
}))}
/>
</div>
<div>
<Label htmlFor="state">State</Label>
<Input
id="state"
value={settings.site.address.state}
onChange={(e) => setSettings(prev => ({
...prev,
site: {
...prev.site,
address: { ...prev.site.address, state: e.target.value }
}
}))}
/>
</div>
<div>
<Label htmlFor="zipCode">Zip Code</Label>
<Input
id="zipCode"
value={settings.site.address.zipCode}
onChange={(e) => setSettings(prev => ({
...prev,
site: {
...prev.site,
address: { ...prev.site.address, zipCode: e.target.value }
}
}))}
/>
</div>
<div className="md:col-span-2">
<Label htmlFor="country">Country</Label>
<Input
id="country"
value={settings.site.address.country}
onChange={(e) => setSettings(prev => ({
...prev,
site: {
...prev.site,
address: { ...prev.site.address, country: e.target.value }
}
}))}
/>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label>Logo</Label>
<div className="space-y-2">
<Input
type="file"
accept="image/*"
onChange={(e) => handleImageUpload(e, 'logo')}
/>
{settings.site.logo && (
<div className="relative w-32 h-16">
<img
src={settings.site.logo}
alt="Logo"
className="w-full h-full object-contain border rounded"
/>
<Button
type="button"
size="sm"
variant="destructive"
className="absolute -top-2 -right-2"
onClick={() => setSettings(prev => ({
...prev,
site: { ...prev.site, logo: '' }
}))}
>
<X className="h-3 w-3" />
</Button>
</div>
)}
</div>
</div>
<div>
<Label>Favicon</Label>
<div className="space-y-2">
<Input
type="file"
accept="image/*"
onChange={(e) => handleImageUpload(e, 'favicon')}
/>
{settings.site.favicon && (
<div className="relative w-16 h-16">
<img
src={settings.site.favicon}
alt="Favicon"
className="w-full h-full object-contain border rounded"
/>
<Button
type="button"
size="sm"
variant="destructive"
className="absolute -top-2 -right-2"
onClick={() => setSettings(prev => ({
...prev,
site: { ...prev.site, favicon: '' }
}))}
>
<X className="h-3 w-3" />
</Button>
</div>
)}
</div>
</div>
</div> {/* Close grid */}
</CardContent>
</Card>
)}

{/* SEO Settings */}
{activeTab === 'seo' && (
<Card>
<CardHeader>
<CardTitle>SEO Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label htmlFor="metaTitle">Meta Title</Label>
<Input
id="metaTitle"
value={settings.seo.metaTitle}
onChange={(e) => setSettings(prev => ({
...prev,
seo: { ...prev.seo, metaTitle: e.target.value }
}))}
/>
</div>
<div>
<Label htmlFor="metaDescription">Meta Description</Label>
<textarea
id="metaDescription"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={3}
value={settings.seo.metaDescription}
onChange={(e) => setSettings(prev => ({
...prev,
seo: { ...prev.seo, metaDescription: e.target.value }
}))}
/>
</div>
</div>

<div>
<Label htmlFor="keywords">Keywords</Label>
<Input
id="keywords"
value={settings.seo.keywords}
onChange={(e) => setSettings(prev => ({
...prev,
seo: { ...prev.seo, keywords: e.target.value }
}))}
/>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label>OG Image</Label>
<div className="space-y-2">
<Input
type="file"
accept="image/*"
onChange={(e) => handleImageUpload(e, 'og')}
/>
{settings.seo.ogImage && (
<div className="relative w-32 h-16">
<img
src={settings.seo.ogImage}
alt="OG Image"
className="w-full h-full object-contain border rounded"
/>
<Button
type="button"
size="sm"
variant="destructive"
className="absolute -top-2 -right-2"
onClick={() => setSettings(prev => ({
...prev,
seo: { ...prev.seo, ogImage: '' }
}))}
>
<X className="h-3 w-3" />
</Button>
</div>
)}
</div>
</div>
<div>
<Label htmlFor="twitterCard">Twitter Card Type</Label>
<select
id="twitterCard"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
value={settings.seo.twitterCard}
onChange={(e) => setSettings(prev => ({
...prev,
seo: { ...prev.seo, twitterCard: e.target.value as 'summary_large_image' | 'summary' }
}))}
>
<option value="summary_large_image">Summary Large Image</option>
<option value="summary">Summary</option>
</select>
</div>
</div>
</CardContent>
</Card>
)}

{/* Homepage Settings */}
{activeTab === 'homepage' && (
<Card>
<CardHeader>
<CardTitle>Homepage Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-6">
<div>
<h3 className="text-lg font-semibold mb-3">Featured Products</h3>
<div className="space-y-2">
<Label htmlFor="featuredTitle">Section Title</Label>
<Input
id="featuredTitle"
value={settings.homepage.featuredProducts.title}
onChange={(e) => setSettings(prev => ({
...prev,
homepage: {
...prev.homepage,
featuredProducts: { ...prev.homepage.featuredProducts, title: e.target.value }
}
}))}
/>
</div>
<div className="flex items-center gap-2 mt-2">
<input
type="checkbox"
id="showAllButton"
checked={settings.homepage.featuredProducts.showAllButton}
onChange={(e) => setSettings(prev => ({
...prev,
homepage: {
...prev.homepage,
featuredProducts: { ...prev.homepage.featuredProducts, showAllButton: e.target.checked }
}
}))}
/>
<Label htmlFor="showAllButton">Show "View All" Button</Label>
</div>
</div>

<div>
<h3 className="text-lg font-semibold mb-3">Trending Products</h3>
<div className="space-y-2">
<Label htmlFor="trendingTitle">Section Title</Label>
<Input
id="trendingTitle"
value={settings.homepage.trendingProducts.title}
onChange={(e) => setSettings(prev => ({
...prev,
homepage: {
...prev.homepage,
trendingProducts: { ...prev.homepage.trendingProducts, title: e.target.value }
}
}))}
/>
</div>
<div className="flex items-center gap-2 mt-2">
<input
type="checkbox"
id="trendingShowAllButton"
checked={settings.homepage.trendingProducts.showAllButton}
onChange={(e) => setSettings(prev => ({
...prev,
homepage: {
...prev.homepage,
trendingProducts: { ...prev.homepage.trendingProducts, showAllButton: e.target.checked }
}
}))}
/>
<Label htmlFor="trendingShowAllButton">Show "View All" Button</Label>
</div>
</div>
</CardContent>
</Card>
)}

{/* Shipping Settings */}
{activeTab === 'shipping' && (
<Card>
<CardHeader>
<CardTitle>Shipping Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div>
<Label htmlFor="freeShippingThreshold">Free Shipping Threshold ($)</Label>
<Input
id="freeShippingThreshold"
type="number"
value={settings.shipping.freeShippingThreshold}
onChange={(e) => setSettings(prev => ({
...prev,
shipping: { ...prev.shipping, freeShippingThreshold: parseFloat(e.target.value) || 0 }
}))}
/>
</div>
<div>
<Label htmlFor="standardShippingCost">Standard Shipping Cost ($)</Label>
<Input
id="standardShippingCost"
type="number"
value={settings.shipping.standardShippingCost}
onChange={(e) => setSettings(prev => ({
...prev,
shipping: { ...prev.shipping, standardShippingCost: parseFloat(e.target.value) || 0 }
}))}
/>
</div>
<div>
<Label htmlFor="expressShippingCost">Express Shipping Cost ($)</Label>
<Input
id="expressShippingCost"
type="number"
value={settings.shipping.expressShippingCost}
onChange={(e) => setSettings(prev => ({
...prev,
shipping: { ...prev.shipping, expressShippingCost: parseFloat(e.target.value) || 0 }
}))}
/>
</div>
</div>

<div>
<h3 className="text-lg font-semibold mb-3">Estimated Delivery Times</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label htmlFor="standardDelivery">Standard Delivery</Label>
<Input
id="standardDelivery"
value={settings.shipping.estimatedDelivery.standard}
onChange={(e) => setSettings(prev => ({
...prev,
shipping: {
...prev.shipping,
estimatedDelivery: {
...prev.shipping.estimatedDelivery,
standard: e.target.value
}
}
}))}
/>
</div>
<div>
<Label htmlFor="expressDelivery">Express Delivery</Label>
<Input
id="expressDelivery"
value={settings.shipping.estimatedDelivery.express}
onChange={(e) => setSettings(prev => ({
...prev,
shipping: {
...prev.shipping,
estimatedDelivery: {
...prev.shipping.estimatedDelivery,
express: e.target.value
}
}
}))}
/>
</div>
</div>
</div>
</CardContent>
</Card>
)}

{/* Payment Settings */}
{activeTab === 'payment' && (
<Card>
<CardHeader>
<CardTitle>Payment Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div>
<Label>Payment Methods</Label>
<div className="space-y-2 mt-2">
<label className="flex items-center gap-2">
<input
type="checkbox"
checked={settings.payment.methods.includes('cod')}
onChange={(e) => {
if (e.target.checked) {
setSettings(prev => ({
...prev,
payment: {
...prev.payment,
methods: [...prev.payment.methods, 'cod']
}
}))
} else {
setSettings(prev => ({
...prev,
payment: {
...prev.payment,
methods: prev.payment.methods.filter(m => m !== 'cod')
}
}))
}
}}
/>
Cash on Delivery (COD)
</label>
</div>
</div>

{settings.payment.methods.includes('cod') && (
<div>
<Label htmlFor="codInstructions">COD Instructions</Label>
<textarea
id="codInstructions"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={4}
value={settings.payment.cod.instructions}
onChange={(e) => setSettings(prev => ({
...prev,
payment: {
...prev.payment,
cod: {
...prev.payment.cod,
instructions: e.target.value
}
}
}))}
/>
</div>
)}
</CardContent>
</Card>
)}

{/* Tax Settings */}
{activeTab === 'taxes' && (
<Card>
<CardHeader>
<CardTitle>Tax Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="flex items-center gap-2">
<input
type="checkbox"
id="taxEnabled"
checked={settings.taxes.enabled}
onChange={(e) => setSettings(prev => ({
...prev,
taxes: { ...prev.taxes, enabled: e.target.checked }
}))}
/>
<Label htmlFor="taxEnabled">Enable Taxes</Label>
</div>

{settings.taxes.enabled && (
<div className="space-y-4">
<div>
<Label htmlFor="taxRate">Tax Rate (%)</Label>
<Input
id="taxRate"
type="number"
step="0.01"
value={settings.taxes.rate}
onChange={(e) => setSettings(prev => ({
...prev,
taxes: { ...prev.taxes, rate: parseFloat(e.target.value) || 0 }
}))}
/>
</div>

<div className="flex items-center gap-2">
<input
type="checkbox"
id="taxIncluded"
checked={settings.taxes.includedInPrice}
onChange={(e) => setSettings(prev => ({
...prev,
taxes: { ...prev.taxes, includedInPrice: e.target.checked }
}))}
/>
<Label htmlFor="taxIncluded">Tax included in price</Label>
</div>
</div>
)}
</CardContent>
</Card>
)}

{/* Currency Settings */}
{activeTab === 'currency' && (
<Card>
<CardHeader>
<CardTitle>Currency Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div>
<Label htmlFor="currencyCode">Currency Code</Label>
<Input
id="currencyCode"
value={settings.currency.code}
onChange={(e) => setSettings(prev => ({
...prev,
currency: { ...prev.currency, code: e.target.value }
}))}
/>
</div>
<div>
<Label htmlFor="currencySymbol">Currency Symbol</Label>
<Input
id="currencySymbol"
value={settings.currency.symbol}
onChange={(e) => setSettings(prev => ({
...prev,
currency: { ...prev.currency, symbol: e.target.value }
}))}
/>
</div>
<div>
<Label htmlFor="currencyPosition">Symbol Position</Label>
<select
id="currencyPosition"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
value={settings.currency.position}
onChange={(e) => setSettings(prev => ({
...prev,
currency: { ...prev.currency, position: e.target.value as 'before' | 'after' }
}))}
>
<option value="before">Before ($100)</option>
<option value="after">After (100$)</option>
</select>
</div>
</div>
</CardContent>
</Card>
)}

{/* Email Settings */}
{activeTab === 'email' && (
<Card>
<CardHeader>
<CardTitle>Email Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<Label htmlFor="fromName">From Name</Label>
<Input
id="fromName"
value={settings.email.fromName}
onChange={(e) => setSettings(prev => ({
...prev,
email: { ...prev.email, fromName: e.target.value }
}))}
/>
</div>
<div>
<Label htmlFor="fromEmail">From Email</Label>
<Input
id="fromEmail"
type="email"
value={settings.email.fromEmail}
onChange={(e) => setSettings(prev => ({
...prev,
email: { ...prev.email, fromEmail: e.target.value }
}))}
/>
</div>
</div>

<div>
<h3 className="text-lg font-semibold mb-3">Email Templates</h3>
<div className="space-y-4">
{/* Order Confirmation */}
<div>
<h4 className="font-medium mb-2">Order Confirmation</h4>
<div className="space-y-2">
<Input
placeholder="Subject"
value={settings.email.templates.orderConfirmation.subject}
onChange={(e) => setSettings(prev => ({
...prev,
email: {
...prev.email,
templates: {
...prev.email.templates,
orderConfirmation: {
...prev.email.templates.orderConfirmation,
subject: e.target.value
}
}
}
}))}
/>
<textarea
placeholder="Email body"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={3}
value={settings.email.templates.orderConfirmation.body}
onChange={(e) => setSettings(prev => ({
...prev,
email: {
...prev.email,
templates: {
...prev.email.templates,
orderConfirmation: {
...prev.email.templates.orderConfirmation,
body: e.target.value
}
}
}
}))}
/>
</div>
</div>

{/* Order Shipped */}
<div>
<h4 className="font-medium mb-2">Order Shipped</h4>
<div className="space-y-2">
<Input
placeholder="Subject"
value={settings.email.templates.orderShipped.subject}
onChange={(e) => setSettings(prev => ({
...prev,
email: {
...prev.email,
templates: {
...prev.email.templates,
orderShipped: {
...prev.email.templates.orderShipped,
subject: e.target.value
}
}
}
}))}
/>
<textarea
placeholder="Email body"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={3}
value={settings.email.templates.orderShipped.body}
onChange={(e) => setSettings(prev => ({
...prev,
email: {
...prev.email,
templates: {
...prev.email.templates,
orderShipped: {
...prev.email.templates.orderShipped,
body: e.target.value
}
}
}
}))}
/>
</div>
</div>

{/* Order Delivered */}
<div>
<h4 className="font-medium mb-2">Order Delivered</h4>
<div className="space-y-2">
<Input
placeholder="Subject"
value={settings.email.templates.orderDelivered.subject}
onChange={(e) => setSettings(prev => ({
...prev,
email: {
...prev.email,
templates: {
...prev.email.templates,
orderDelivered: {
...prev.email.templates.orderDelivered,
subject: e.target.value
}
}
}
}))}
/>
<textarea
placeholder="Email body"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={3}
value={settings.email.templates.orderDelivered.body}
onChange={(e) => setSettings(prev => ({
...prev,
email: {
...prev.email,
templates: {
...prev.email.templates,
orderDelivered: {
...prev.email.templates.orderDelivered,
body: e.target.value
}
}
}
}))}
/>
</div>
</div>
</div>
</div>
</CardContent>
</Card>
)}

{/* Footer Settings */}
{activeTab === 'footer' && (
<Card>
<CardHeader>
<CardTitle>Footer Settings</CardTitle>
</CardHeader>
<CardContent className="space-y-4">
<div>
<Label htmlFor="copyright">Copyright Text</Label>
<Input
id="copyright"
value={settings.footer.copyright}
onChange={(e) => setSettings(prev => ({
...prev,
footer: { ...prev.footer, copyright: e.target.value }
}))}
/>
</div>

<div>
<Label htmlFor="about">About Section</Label>
<textarea
id="about"
className="w-full px-3 py-2 border border-gray-300 rounded-md"
rows={3}
value={settings.footer.content.about}
onChange={(e) => setSettings(prev => ({
...prev,
footer: {
...prev.footer,
content: {
...prev.footer.content,
about: e.target.value
}
}
}))}
/>
</div>

<div>
<Label>Payment Methods</Label>
<div className="flex gap-4 mt-2">
{['Credit Card', 'PayPal', 'Stripe', 'COD'].map((method) => (
<label key={method} className="flex items-center gap-2">
<input
type="checkbox"
checked={settings.footer.paymentMethods.includes(method)}
onChange={(e) => {
if (e.target.checked) {
setSettings(prev => ({
...prev,
footer: {
...prev.footer,
paymentMethods: [...prev.footer.paymentMethods, method]
}
}))
} else {
setSettings(prev => ({
...prev,
footer: {
...prev.footer,
paymentMethods: prev.footer.paymentMethods.filter(m => m !== method)
}
}))
}
}}
/>
{method}
</label>
))}
</div>
</div>
</CardContent>
</Card>
)}

{/* Save Button */}
<div className="flex justify-end mt-8">
<Button type="submit" disabled={loading}>
<Save className="mr-2 h-4 w-4" />
{loading ? 'Saving...' : 'Save Settings'}
</Button>
</div>
</form>
</div>
);
}