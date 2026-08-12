'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { addToCart } from '../../../store/cartSlice';
import { addToCompare, removeFromCompare } from '../../../store/compareSlice';
import { 
  Star, ShieldAlert, Truck, ChevronRight, ShoppingCart, 
  HelpCircle, RefreshCcw, Smartphone, BadgePercent, ArrowLeftRight 
} from 'lucide-react';
import styles from './details.module.css';
import { useToast } from '../../../context/ToastContext';

function checkIsAccessory(p: any): boolean {
  if (!p) return false;
  if (p.category === 'accessories' || p.category === 'accessory' || !!p.accessoryType) {
    return true;
  }
  if (p.variants && p.variants.some((v: any) => Boolean(v.ram || v.storage))) {
    return false;
  }
  return false;
}

function getFormattedProductName(p: any): string {
  if (!p || !p.name) return '';
  const brandName = (p.brand?.name || p.brand || '').toString().trim();
  const prodName = p.name.trim();

  if (brandName && prodName.toLowerCase().startsWith(brandName.toLowerCase())) {
    return prodName;
  }
  return brandName ? `${brandName} ${prodName}` : prodName;
}

function getParsedSpecs(p: any) {
  if (!p) return {};
  const lowerName = (p.name || '').toLowerCase();
  const brandName = (p.brand?.name || p.brand || '').toString().toLowerCase();
  const lowerDesc = (p.description || '').toLowerCase();
  const existing = p.specs || p.specifications || {};

  const isVal = (v: any) => v && v !== 'N/A' && v !== 'null' && v !== 'undefined' && typeof v === 'string' && v.trim().length > 0;

  let display = isVal(existing.display) ? existing.display : isVal(existing.displayDetails) ? existing.displayDetails : null;
  let processor = isVal(existing.processor) ? existing.processor : isVal(existing.cpu) ? existing.cpu : null;
  let battery = isVal(existing.battery) ? existing.battery : isVal(existing.batteryCapacity) ? existing.batteryCapacity : null;
  let charging = isVal(existing.charging) ? existing.charging : isVal(existing.chargingSpeed) ? existing.chargingSpeed : null;
  let rearCamera = isVal(existing.rearCamera) ? existing.rearCamera : isVal(existing.camera) ? existing.camera : null;
  let frontCamera = isVal(existing.frontCamera) ? existing.frontCamera : isVal(existing.frontCameraSetup) ? existing.frontCameraSetup : null;
  let operatingSystem = isVal(existing.operatingSystem) ? existing.operatingSystem : isVal(existing.os) ? existing.os : null;
  let refreshRate = isVal(existing.refreshRate) ? existing.refreshRate : null;
  let warranty = isVal(existing.warranty) ? existing.warranty : '1 Year Manufacturer Warranty';
  let network = isVal(existing.network) ? existing.network : (p.is5G !== false ? '5G Dual SIM' : '4G VoLTE');
  let simType = isVal(existing.simType) ? existing.simType : 'Dual Nano SIM';

  // Smart extractions for missing values:
  if (!processor) {
    if (lowerName.includes('iqoo') || lowerDesc.includes('8s gen 3')) processor = 'Qualcomm Snapdragon 8s Gen 3 (4nm)';
    else if (lowerName.includes('iphone 15 pro') || lowerDesc.includes('a17 pro')) processor = 'Apple A17 Pro (3nm)';
    else if (lowerName.includes('iphone 15') || lowerDesc.includes('a16 bionic')) processor = 'Apple A16 Bionic (4nm)';
    else if (lowerName.includes('s24 ultra') || lowerDesc.includes('snapdragon 8 gen 3')) processor = 'Snapdragon 8 Gen 3 for Galaxy (4nm)';
    else if (lowerName.includes('x100') || lowerDesc.includes('dimensity 9300')) processor = 'MediaTek Dimensity 9300 (4nm)';
    else if (lowerDesc.includes('dimensity 7050')) processor = 'MediaTek Dimensity 7050 Octa-Core';
    else if (lowerDesc.includes('tensor g3')) processor = 'Google Tensor G3 (4nm)';
    else if (brandName.includes('apple')) processor = 'Apple A-Series Bionic Chip';
    else if (brandName.includes('samsung')) processor = 'Snapdragon / Exynos Octa-Core';
    else processor = 'High-Performance 4nm Octa-Core Processor';
  }

  if (!display) {
    if (lowerDesc.includes('super retina xdr')) display = '6.7-inch Super Retina XDR OLED (120Hz ProMotion)';
    else if (lowerDesc.includes('dynamic amoled 2x')) display = '6.8-inch QHD+ Dynamic AMOLED 2X (120Hz Adaptive)';
    else if (lowerDesc.includes('1.5k') || lowerDesc.includes('curved amoled')) display = '6.78-inch 1.5K 120Hz Curved AMOLED (2800 nits)';
    else if (lowerDesc.includes('amoled')) display = '6.67-inch 120Hz FHD+ AMOLED Screen';
    else display = '6.67-inch 120Hz Full HD+ Touch Display';
  }

  if (!refreshRate) {
    if (lowerDesc.includes('144hz')) refreshRate = '144Hz';
    else if (lowerDesc.includes('90hz')) refreshRate = '90Hz';
    else refreshRate = '120Hz';
  }

  if (!rearCamera) {
    if (lowerDesc.includes('200mp')) rearCamera = '200MP Main OIS + 50MP Periscope + 12MP Ultra-Wide';
    else if (lowerDesc.includes('48mp')) rearCamera = '48MP Main (Sensor-Shift OIS) + 12MP Ultra-Wide + 12MP Telephoto';
    else if (lowerDesc.includes('zeiss') || lowerDesc.includes('50mp')) rearCamera = '50MP Sony VCS OIS Main + 50MP Portrait + 50MP Ultra-Wide';
    else rearCamera = '50MP OIS Primary Camera + 8MP Ultra-Wide';
  }

  if (!frontCamera) {
    if (lowerName.includes('iphone') || brandName === 'apple') frontCamera = '12MP TrueDepth Front Camera with Autofocus';
    else if (lowerName.includes('vivo') || lowerDesc.includes('zeiss')) frontCamera = '50MP Eye-AF Group Selfie Camera';
    else frontCamera = '32MP HD Selfie Camera with AI Portrait Mode';
  }

  if (!battery) {
    const battMatch = p.description?.match(/(\d{4})\s*mAh/i);
    battery = battMatch ? `${battMatch[1]} mAh` : '5000 mAh';
  }

  if (!charging) {
    const chargMatch = p.description?.match(/(\d+W)\s*(flashcharge|supervooc|hypercharge|fast|charger)?/i);
    charging = chargMatch ? `${chargMatch[1]} Fast Charging` : '67W Turbo Fast Charging';
  }

  if (!operatingSystem) {
    if (lowerName.includes('iphone') || brandName === 'apple') operatingSystem = 'iOS 17';
    else if (brandName === 'samsung') operatingSystem = 'Android 14 (One UI 6.1)';
    else if (brandName === 'vivo' || lowerName.includes('iqoo')) operatingSystem = 'Android 14 (Funtouch OS 14)';
    else operatingSystem = 'Android 14 UI';
  }

  return {
    display,
    processor,
    rearCamera,
    frontCamera,
    battery,
    charging,
    operatingSystem,
    refreshRate,
    warranty,
    network,
    simType
  };
}

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const slug = params.slug as string;
  const { showToast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const productsCatalog = useSelector((state: RootState) => state.products.items);
  const compareItems = useSelector((state: RootState) => state.compare.items);

  // Variant selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedRam, setSelectedRam] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const [colorImageOverride, setColorImageOverride] = useState<string | null>(null);

  // 360° rotation viewer and sales ends countdown timer removed

  // Delivery check
  const [pincode, setPincode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);

  // Reviews submission
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // Compatible accessories states
  const [checkedAccessories, setCheckedAccessories] = useState<string[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          setReviewsList(data.reviews || []);
          
          const isAcc = checkIsAccessory(data);

          // Set initial variants configurations
          if (data.variants && data.variants.length > 0) {
            const initColor = data.variants[0].color || (data.colorVariants && data.colorVariants[0]) || (data.colors && data.colors[0]) || '';
            setSelectedColor(initColor);
            setSelectedRam(data.variants[0].ram || (data.ramVariants && data.ramVariants[0]) || data.specifications?.ram || data.specs?.ram || '');
            setSelectedStorage(data.variants[0].storage || (data.storageVariants && data.storageVariants[0]) || data.specifications?.storage || data.specs?.storage || '');
            setSelectedPrice(parseFloat(data.variants[0].discountPrice || data.variants[0].price || data.discountPrice || data.price || 0));
            setSelectedStock(data.variants[0].stock !== undefined ? data.variants[0].stock : (data.stock !== undefined ? data.stock : 10));
            
            const colorImg = data.variants[0].image || data.colorImages?.[initColor] || data.colorImages?.[data.colorVariants?.find((c: string) => c.toLowerCase() === (initColor || '').toLowerCase()) || ''] || data.colorImages?.[data.colors?.find((c: string) => c.toLowerCase() === (initColor || '').toLowerCase()) || ''];
            if (colorImg) {
              setColorImageOverride(colorImg);
            }
          } else {
            setSelectedPrice(parseFloat(data.discountPrice || data.price || data.basePrice || 0));
            setSelectedStock(data.stock !== undefined ? data.stock : 10);
            const initColor = (data.colorVariants && data.colorVariants[0]) || (data.colors && data.colors[0]) || '';
            if (initColor) {
              setSelectedColor(initColor);
              const colorImg = data.colorImages?.[initColor];
              if (colorImg) setColorImageOverride(colorImg);
            }
          }
        } else {
          // Mock data fallback
          loadMockDetails();
        }
      } catch (_) {
        loadMockDetails();
      } finally {
        setLoading(false);
      }
    };

    const loadMockDetails = () => {
      const match = productsCatalog.find((p: any) => p.slug === slug);
      if (match) {
        const clonedMatch = JSON.parse(JSON.stringify(match));
        const defaultColor = clonedMatch.colorVariants?.[0] || clonedMatch.colors?.[0] || 'Default';
        const defaultRam = clonedMatch.specs?.ram || '8GB';
        const defaultStorage = clonedMatch.specs?.storage || '128GB';

        if (clonedMatch.category === 'accessories' || clonedMatch.accessoryType) {
          clonedMatch.variants = clonedMatch.variants || [];
          setProduct(clonedMatch);
          setReviewsList(clonedMatch.reviews || [
            { id: 'r1', rating: 5, comment: 'Exceptional build quality and value!', user: { name: 'Aryan K.' } }
          ]);
          setSelectedColor(defaultColor);
          setSelectedRam('');
          setSelectedStorage('');
          setSelectedPrice(parseFloat((clonedMatch.discountPrice || clonedMatch.basePrice || clonedMatch.price || 0).toString()));
          setSelectedStock(clonedMatch.stock !== undefined ? clonedMatch.stock : 15);
          
          const colorImg = clonedMatch.colorImages?.[defaultColor] || clonedMatch.colorImages?.[clonedMatch.colors?.find((c: string) => c.toLowerCase() === defaultColor.toLowerCase()) || ''];
          if (colorImg) {
            setColorImageOverride(colorImg);
          }
          return;
        }

        if (!clonedMatch.variants || clonedMatch.variants.length === 0) {
          const createdVariants: any[] = [];
          const colors = clonedMatch.colors && clonedMatch.colors.length > 0 ? clonedMatch.colors : ['Default'];
          let idCounter = 1;
          colors.forEach((col: string, colIdx: number) => {
            const colorPriceMultiplier = colIdx === 1 ? 1.05 : 1.0; 
            
            // Vary stock levels across color indexes to make some colors in-stock and others out-of-stock
            const baseStock = colIdx === 0 ? 10 : 0; 
            const variantStock = colIdx === 0 ? 0 : 8; 

            createdVariants.push({
              id: `v-auto-${idCounter++}`,
              color: col,
              ram: defaultRam,
              storage: defaultStorage,
              price: Math.round(clonedMatch.basePrice * colorPriceMultiplier),
              discountPrice: clonedMatch.discountPrice ? Math.round(clonedMatch.discountPrice * colorPriceMultiplier) : Math.round(clonedMatch.basePrice * colorPriceMultiplier),
              stock: baseStock
            });
            const secondStorage = defaultStorage === '256GB' ? '512GB' : '256GB';
            createdVariants.push({
              id: `v-auto-${idCounter++}`,
              color: col,
              ram: defaultRam,
              storage: secondStorage,
              price: Math.round(clonedMatch.basePrice * 1.15 * colorPriceMultiplier),
              discountPrice: clonedMatch.discountPrice ? Math.round(clonedMatch.discountPrice * 1.15 * colorPriceMultiplier) : Math.round(clonedMatch.basePrice * 1.15 * colorPriceMultiplier),
              stock: variantStock
            });
          });
          clonedMatch.variants = createdVariants;
        }

        setProduct(clonedMatch);
        setReviewsList(clonedMatch.reviews || [
          { id: 'r1', rating: 5, comment: 'Stunning display and builds. Feels extremely luxurious!', user: { name: 'Rahul S.' } }
        ]);
        setSelectedColor(defaultColor);
        setSelectedRam(defaultRam);
        setSelectedStorage(defaultStorage);
        setSelectedPrice(parseFloat((clonedMatch.discountPrice || clonedMatch.basePrice || 0).toString()));
        setSelectedStock(clonedMatch.variants[0].stock !== undefined ? clonedMatch.variants[0].stock : clonedMatch.stock);
        
        const colorImg = clonedMatch.colorImages?.[defaultColor] || clonedMatch.colorImages?.[clonedMatch.colors?.find((c: string) => c.toLowerCase() === defaultColor.toLowerCase()) || ''];
        if (colorImg) {
          setColorImageOverride(colorImg);
        }
        return;
      }

      const isLava = slug.includes('lava');
      const baseColors = isLava ? ['Viridian Glass'] : ['Sunset Blue', 'Asteroid Black'];
      const mockProduct = {
        id: isLava ? 'lava-1' : 'vivo-1',
        name: isLava ? 'Lava Agni 2 5G' : 'Vivo X100 Pro',
        brand: { name: isLava ? 'Lava' : 'Vivo' },
        stock: isLava ? 50 : 15,
        description: isLava 
          ? 'India\'s absolute disruptor. Featuring a premium curved AMOLED panel, Dimensity 7050, and sleek glass design.'
          : 'Co-engineered with ZEISS optics, the Vivo X100 Pro brings professional photography to your pocket.',
        basePrice: isLava ? 25999 : 89999,
        discountPrice: isLava ? 19999 : 84999,
        images: isLava 
          ? ['https://images.unsplash.com/photo-1557180295-76eee20ae8aa?q=80&w=600']
          : ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600'],
        colors: baseColors,
        specs: {
          processor: isLava ? 'MediaTek Dimensity 7050' : 'MediaTek Dimensity 9300',
          camera: isLava ? '50MP ZEISS Main + 50MP Periscope' : '50MP ZEISS Main + 50MP Periscope',
          battery: isLava ? '4700 mAh' : '5400 mAh',
          display: isLava ? '6.78 inch Curved AMOLED' : '6.78 inch LTPO AMOLED',
          charging: isLava ? '66W Super Charger' : '100W FlashCharge',
          os: isLava ? 'Android 13 Clean UI' : 'Android 14 (Funtouch OS)',
          refreshRate: '120Hz',
          ram: isLava ? '8GB' : '12GB',
          storage: '256GB'
        },
        variants: isLava 
          ? [
              { id: 'v1', color: 'Viridian Glass', ram: '8GB', storage: '256GB', price: 25999, discountPrice: 19999, stock: 12 },
              { id: 'v2', color: 'Viridian Glass', ram: '12GB', storage: '512GB', price: 29999, discountPrice: 23999, stock: 0 }
            ]
          : [
              { id: 'v1', color: 'Sunset Blue', ram: '12GB', storage: '256GB', price: 89999, discountPrice: 84999, stock: 15 },
              { id: 'v2', color: 'Sunset Blue', ram: '16GB', storage: '512GB', price: 94999, discountPrice: 89999, stock: 0 },
              { id: 'v3', color: 'Asteroid Black', ram: '12GB', storage: '256GB', price: 92999, discountPrice: 87999, stock: 5 },
              { id: 'v4', color: 'Asteroid Black', ram: '16GB', storage: '512GB', price: 97999, discountPrice: 92999, stock: 0 }
            ],
        accessories: [
          { accessoryName: 'SuperShield Tempered Glass', accessoryPrice: 499, accessoryImage: '' },
          { accessoryName: 'Premium Matte Back Case', accessoryPrice: 299, accessoryImage: '' }
        ],
        colorImages: isLava 
          ? { 'Viridian Glass': 'https://images.unsplash.com/photo-1557180295-76eee20ae8aa?q=80&w=600' }
          : {
              'Sunset Blue': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600',
              'Asteroid Black': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600'
            }
      };
      setProduct(mockProduct);
      setReviewsList([
        { id: 'r1', rating: 5, comment: 'Stunning display and builds. Feels extremely luxurious!', user: { name: 'Rahul S.' } }
      ]);
      setSelectedColor(mockProduct.colors[0]);
      setSelectedRam(mockProduct.variants[0].ram);
      setSelectedStorage(mockProduct.variants[0].storage);
      setSelectedPrice(mockProduct.variants[0].discountPrice || mockProduct.variants[0].price);
      setSelectedStock(mockProduct.variants[0].stock !== undefined ? mockProduct.variants[0].stock : mockProduct.stock);
      
      const initColor = mockProduct.colors[0];
      const colorImagesMap = mockProduct.colorImages as any;
      const colorImg = colorImagesMap?.[initColor] || colorImagesMap?.[mockProduct.colors?.find((c: string) => c.toLowerCase() === initColor.toLowerCase()) || ''];
      if (colorImg) {
        setColorImageOverride(colorImg);
      }
    };

    fetchDetails();
  }, [slug]);

  // Helper to find matching variant and update prices/specs
  const updateSelection = (newColor: string, newRam: string, newStorage: string) => {
    if (!product || !product.variants || product.variants.length === 0) {
      setSelectedColor(newColor);
      setSelectedRam(newRam);
      setSelectedStorage(newStorage);
      return;
    }

    const isAcc = checkIsAccessory(product);

    if (isAcc) {
      const matched = product.variants.find(
        (v: any) => v.color && v.color.toLowerCase() === newColor.toLowerCase()
      ) || product.variants[0];

      setSelectedColor(matched.color || newColor);
      setSelectedPrice(parseFloat(matched.discountPrice || matched.price || product.discountPrice || product.price || 0));
      setSelectedStock(matched.stock !== undefined ? matched.stock : product.stock);
      const colorImg = matched.image || product.colorImages?.[matched.color || newColor];
      if (colorImg) {
        setColorImageOverride(colorImg);
      }
      return;
    }

    // Try to find a variant matching color, RAM, and storage
    let matched = product.variants.find(
      (v: any) =>
        (!v.color || v.color.toLowerCase() === newColor.toLowerCase()) &&
        (!newRam || v.ram === newRam) &&
        (!newStorage || v.storage === newStorage)
    );

    // If not found, try finding a variant matching color first, then find closest specs
    if (!matched) {
      const colorVariants = product.variants.filter(
        (v: any) => !v.color || v.color.toLowerCase() === newColor.toLowerCase()
      );
      if (colorVariants.length > 0) {
        matched = colorVariants[0];
      }
    }

    // If still not found (e.g. no variants for this color yet), try finding matching RAM + Storage
    if (!matched) {
      matched = product.variants.find(
        (v: any) =>
          (!newRam || v.ram === newRam) &&
          (!newStorage || v.storage === newStorage)
      );
    }

    // Fallback to first variant if none of the above matched
    if (!matched) {
      matched = product.variants[0];
    }

    // Update states
    setSelectedColor(matched.color || newColor);
    setSelectedRam(matched.ram || newRam);
    setSelectedStorage(matched.storage || newStorage);
    setSelectedPrice(parseFloat(matched.discountPrice || matched.price || product.discountPrice || product.price || 0));
    setSelectedStock(matched.stock !== undefined ? matched.stock : product.stock);
    
    const colorImg = matched.image || product.colorImages?.[matched.color || newColor] || product.colorImages?.[product.colors?.find((c: string) => c.toLowerCase() === (matched.color || newColor).toLowerCase()) || ''];
    if (colorImg) {
      setColorImageOverride(colorImg);
    }
  };

  // Helper to determine if a color variant configuration is out of stock for the selected storage/RAM
  const isColorConfigOutOfStock = (colorName: string) => {
    if (!product || !product.variants) return false;
    const isAcc = checkIsAccessory(product);

    if (isAcc) {
      const matchedVar = product.variants.find(
        (v: any) => v.color && v.color.toLowerCase() === colorName.toLowerCase()
      );
      return matchedVar ? matchedVar.stock === 0 : false;
    }

    const matchedVar = product.variants.find(
      (v: any) =>
        (!v.color || v.color.toLowerCase() === colorName.toLowerCase()) &&
        (!selectedRam || v.ram === selectedRam) &&
        (!selectedStorage || v.storage === selectedStorage)
    );
    return matchedVar ? matchedVar.stock === 0 : false;
  };

  // Helper to determine if a memory variant is out of stock in the currently selected color
  const isVariantConfigOutOfStock = (v: any) => {
    if (!product || !product.variants) return false;
    const matchedVar = product.variants.find(
      (item: any) =>
        (!item.color || item.color.toLowerCase() === selectedColor.toLowerCase()) &&
        item.ram === v.ram &&
        item.storage === v.storage
    );
    return matchedVar ? matchedVar.stock === 0 : false;
  };

  const handleToggleCompare = () => {
    if (!product) return;
    const inCompare = compareItems.some((i: any) => i.id === product.id);
    if (inCompare) {
      dispatch(removeFromCompare(product.id));
      showToast(`${product.name} removed from comparison matrix.`, 'info');
    } else {
      if (compareItems.length >= 4) {
        showToast('You can only compare a maximum of 4 smartphones.', 'warning');
        return;
      }
      dispatch(
        addToCompare({
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || '',
          brand: product.brand?.name || product.brand || 'Smart',
          price: selectedPrice,
          specs: {
            processor: product.specs?.processor || 'Octa-core',
            camera: product.specs?.rearCamera || '50MP',
            battery: product.specs?.battery || '5000mAh',
            display: product.specs?.display || 'AMOLED',
            refreshRate: product.specs?.refreshRate || '120Hz'
          }
        })
      );
      showToast(`${product.name} added to comparison matrix.`, 'success');
    }
  };

  // Delivery check helper
  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6 && /^\d+$/.test(pincode)) {
      setDeliveryStatus('Standard delivery available. Expect package within 2-4 business days.');
    } else {
      setDeliveryStatus('Invalid pincode. Please input a valid 6-digit postal code.');
    }
  };

  // Checkbox accessories
  const toggleAccessory = (accName: string) => {
    setCheckedAccessories((prev) =>
      prev.includes(accName) ? prev.filter((a) => a !== accName) : [...prev, accName]
    );
  };

  // Add items to cart
  const handleCartAdd = (redirect: boolean) => {
    if (!product) return;

    // 1. Add Main Phone Variant
    dispatch(
      addToCart({
        productId: product.id,
        name: `${product.name} (${selectedRam}/${selectedStorage})`,
        image: product.images[0],
        brand: product.brand?.name || 'Smart',
        ram: selectedRam,
        storage: selectedStorage,
        color: selectedColor,
        price: selectedPrice,
        quantity: 1
      })
    );

    // 2. Add Checked Accessories
    checkedAccessories.forEach((accName) => {
      const acc = product.accessories.find((a: any) => a.accessoryName === accName);
      if (acc) {
        dispatch(
          addToCart({
            productId: `acc-${accName}`,
            name: `${accName} (Accessory for ${product.name})`,
            image: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=150',
            brand: product.brand?.name || 'Smart',
            ram: '',
            storage: '',
            color: 'Default',
            price: parseFloat(acc.accessoryPrice),
            quantity: 1
          })
        );
      }
    });

    if (redirect) {
      router.push('/cart');
    } else {
      showToast(`${product.name} and accessories added to cart!`, 'success');
    }
  };

  // Review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewComment.trim()) {
      const newRev = {
        id: `rev-${Date.now()}`,
        rating: reviewRating,
        comment: reviewComment,
        user: { name: 'You' }
      };
      setReviewsList([newRev, ...reviewsList]);
      setReviewComment('');
      showToast('Thank you! Your review has been submitted.', 'success');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Analyzing phone details...</div>;
  }

  if (!product) {
    return <div className={styles.loading}>Error loading product details.</div>;
  }

  // Helper flag to identify accessories
  const isAccessory = checkIsAccessory(product);

  // Available colors array derived from actual variants in DB
  const availableColors: string[] = (() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) {
      const varColors = Array.from(new Set(product.variants.map((v: any) => v.color).filter(Boolean))) as string[];
      if (varColors.length > 0) return varColors;
    }
    if (product.colorVariants && product.colorVariants.length > 0) {
      return product.colorVariants;
    }
    if (product.colors && product.colors.length > 0) {
      return product.colors;
    }
    return [];
  })();

  // Collect all unique RAM + Storage variant options across the entire product
  const allVariantConfigs = (() => {
    if (!product.variants || product.variants.length === 0 || isAccessory) return [];
    const map = new Map<string, any>();
    product.variants.forEach((v: any) => {
      const storageVal = v.storage || product.specifications?.storage || product.specs?.storage || '';
      const ramVal = v.ram || product.specifications?.ram || product.specs?.ram || '';
      const key = `${storageVal}-${ramVal}`;
      if (!map.has(key)) {
        map.set(key, { ...v, storage: storageVal, ram: ramVal });
      }
    });
    return Array.from(map.values());
  })();

  return (
    <div className={`${styles.detailsPage} container`}>
      <div className={styles.layoutGrid}>
        {/* Left Column: Image Gallery */}
        <div className={styles.visualCol}>
          <div className={styles.galleryContainer}>
            {/* Side Column: Smaller Image Cards */}
            {product.images && product.images.length > 1 && (
              <div className={styles.thumbnailSideCol}>
                {product.images.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className={`${styles.thumbnailCard} ${activeImageIdx === idx && !colorImageOverride ? styles.activeThumbnailCard : ''}`}
                    onClick={() => {
                      setActiveImageIdx(idx);
                      setColorImageOverride(null);
                    }}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className={styles.thumbnailImg}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Main Product Image Card (Medium Size) */}
            <div className={`${styles.mainImageCard} glass`}>
              <img
                src={colorImageOverride || product.images?.[activeImageIdx] || product.images?.[0]}
                alt={product.name}
                className={styles.mainProductImage}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Buying parameters */}
        <div className={styles.metaCol}>
          {/* 1. Visit Brand & Dynamically Formatted Title */}
          <div className={styles.visitBrandRow}>
            {isAccessory ? (
              <h1 className={styles.formattedTitle}>
                {getFormattedProductName(product)} {selectedColor ? `(${selectedColor})` : ''}
              </h1>
            ) : (
              <h1 className={styles.formattedTitle}>
                {getFormattedProductName(product)} ({selectedColor}{selectedStorage ? `, ${selectedStorage}` : ''}){selectedRam ? ` (${selectedRam} RAM)` : ''}
              </h1>
            )}
            <div className={styles.ratingBadge}>
              <span className={styles.ratingText}>4.6 ★</span>
              <span className={styles.divider}>|</span>
              <span className={styles.reviewsCount}>230 ratings</span>
              <span className={styles.divider}>|</span>
              <span style={{
                color: selectedStock !== null
                  ? (selectedStock > 0 ? (selectedStock <= 5 ? 'var(--warning)' : 'var(--success)') : 'var(--error)')
                  : (product.stock > 0 ? (product.stock <= 5 ? 'var(--warning)' : 'var(--success)') : 'var(--error)'),
                fontWeight: 700
              }}>
                {selectedStock !== null
                  ? (selectedStock > 0 ? (selectedStock <= 5 ? 'Few Stock Only' : 'In Stock') : 'Out of Stock')
                  : (product.stock > 0 ? (product.stock <= 5 ? 'Few Stock Only' : 'In Stock') : 'Out of Stock')}
              </span>
            </div>
          </div>

          {/* 2. Price Hero Row */}
          {(() => {
            const baseP = product.basePrice || product.price || selectedPrice;
            const discP = selectedPrice;
            const hasDiscount = baseP > discP;
            const discountPercent = hasDiscount ? Math.round(((baseP - discP) / baseP) * 100) : 0;
            return (
              <div className={styles.priceHeroRow}>
                {discountPercent > 0 && (
                  <span className={styles.heroDiscountArrow}>↓{discountPercent}%</span>
                )}
                {hasDiscount && (
                  <span className={styles.heroBasePrice}>₹{baseP.toLocaleString()}</span>
                )}
                <span className={styles.heroPrice}>₹{discP.toLocaleString()}</span>
                <span className={styles.protectFeeText}>+₹220 Protect Promise Fee &gt;</span>
              </div>
            );
          })()}

          {/* 3. Selected Color Section */}
          {availableColors.length > 0 && (
            <div className={styles.colorSelectorSection} style={{ marginTop: '20px' }}>
              <p><strong>Selected Color:</strong> <span className={styles.activeColorText}>{selectedColor}</span></p>
              <div className={styles.colorSelectorRow}>
                {availableColors.map((col: string, idx: number) => {
                  const isOutOfStock = isColorConfigOutOfStock(col);
                  const isSelected = selectedColor?.toLowerCase() === col.toLowerCase();
                  return (
                    <button
                      key={col}
                      onClick={() => {
                        if (isAccessory) {
                          const matchedVar = product.variants?.find((v: any) => v.color && v.color.toLowerCase() === col.toLowerCase());
                          setSelectedColor(col);
                          if (matchedVar) {
                            if (matchedVar.price || matchedVar.discountPrice) {
                              setSelectedPrice(parseFloat(matchedVar.discountPrice || matchedVar.price));
                            }
                            if (matchedVar.stock !== undefined) setSelectedStock(matchedVar.stock);
                            if (matchedVar.image) {
                              setColorImageOverride(matchedVar.image);
                            } else {
                              const colorImg = product.colorImages?.[col] || product.colorImages?.[availableColors.find((c: string) => c.toLowerCase() === col.toLowerCase()) || ''];
                              if (colorImg) setColorImageOverride(colorImg);
                            }
                          } else {
                            const colorImg = product.colorImages?.[col] || product.colorImages?.[availableColors.find((c: string) => c.toLowerCase() === col.toLowerCase()) || ''];
                            if (colorImg) setColorImageOverride(colorImg);
                          }
                        } else {
                          updateSelection(col, selectedRam, selectedStorage);
                          if (product.images?.[idx]) {
                            setActiveImageIdx(idx);
                          }
                        }
                      }}
                      className={`${styles.colorSelectorBtn} ${isSelected ? styles.activeColorBtn : ''} ${
                        isOutOfStock ? styles.outOfStockColorBtn : ''
                      }`}
                      title={isOutOfStock ? `${col} (Out of Stock)` : col}
                    >
                      {col} {isOutOfStock && ' (Out of Stock)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Variants Grid for Smartphones */}
          {!isAccessory && allVariantConfigs.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Variant:</strong> <span className={styles.activeVariantText}>{selectedStorage} + {selectedRam}</span></p>
              <div className={styles.variantCardRow}>
                {allVariantConfigs.map((v: any, idx: number) => {
                  const matchedVar = product.variants?.find(
                    (item: any) =>
                      (!item.color || item.color.toLowerCase() === selectedColor.toLowerCase()) &&
                      item.ram === v.ram &&
                      item.storage === v.storage
                  ) || v;

                  const baseP = parseFloat(matchedVar.price || product.basePrice || 0);
                  const discP = parseFloat(matchedVar.discountPrice || matchedVar.price || product.discountPrice || product.basePrice || 0);
                  const hasDiscount = baseP > discP;
                  const discountPercent = hasDiscount ? Math.round(((baseP - discP) / baseP) * 100) : 0;
                  const isSelected = selectedRam === v.ram && selectedStorage === v.storage;
                  const isOutOfStock = matchedVar.stock === 0;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => updateSelection(selectedColor, v.ram, v.storage)}
                      className={`${styles.variantSelectorCard} ${
                        isSelected ? styles.activeVariantCard : ''
                      } ${isOutOfStock ? styles.outOfStockVariantCard : ''}`}
                    >
                      <div className={styles.varTitle}>{v.storage} + {v.ram}</div>
                      {hasDiscount && (
                        <div className={styles.varDiscountRow}>
                          <span className={styles.varDiscountArrow}>↓{discountPercent}%</span>
                          <span className={styles.varBasePrice}>₹{baseP.toLocaleString()}</span>
                        </div>
                      )}
                      <div className={styles.varPrice}>₹{discP.toLocaleString()}</div>
                      {isOutOfStock && (
                        <span className={styles.varStockAlert}>Out of Stock</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accessory Variant Selection Buttons */}
          {isAccessory && product.variants && product.variants.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Available Options / Variants:</strong> <span className={styles.activeVariantText}>{selectedColor || 'Standard'}</span></p>
              <div className={styles.variantCardRow}>
                {product.variants.map((v: any, idx: number) => {
                  const title = v.color || v.name || v.capacity || `Option ${idx + 1}`;
                  const baseP = parseFloat(v.price || product.basePrice || product.price || 0);
                  const discP = parseFloat(v.discountPrice || v.price || product.discountPrice || product.basePrice || product.price || 0);
                  const hasDiscount = baseP > discP;
                  const discountPercent = hasDiscount ? Math.round(((baseP - discP) / baseP) * 100) : 0;
                  const isSelected = selectedColor?.toLowerCase() === (v.color || '').toLowerCase() || (idx === 0 && !selectedColor);
                  const isOutOfStock = v.stock === 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (v.color) setSelectedColor(v.color);
                        setSelectedPrice(discP);
                        if (v.stock !== undefined) setSelectedStock(v.stock);
                        if (v.image) {
                          setColorImageOverride(v.image);
                        } else if (v.color) {
                          const colorImg = product.colorImages?.[v.color];
                          if (colorImg) setColorImageOverride(colorImg);
                        }
                      }}
                      className={`${styles.variantSelectorCard} ${
                        isSelected ? styles.activeVariantCard : ''
                      } ${isOutOfStock ? styles.outOfStockVariantCard : ''}`}
                    >
                      <div className={styles.varTitle}>{title}</div>
                      {hasDiscount && (
                        <div className={styles.varDiscountRow}>
                          <span className={styles.varDiscountArrow}>↓{discountPercent}%</span>
                          <span className={styles.varBasePrice}>₹{baseP.toLocaleString()}</span>
                        </div>
                      )}
                      <div className={styles.varPrice}>₹{discP.toLocaleString()}</div>
                      {isOutOfStock && (
                        <span className={styles.varStockAlert}>Out of Stock</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Product Description */}
          <p className={styles.descText} style={{ marginTop: '20px' }}>{product.description}</p>

          {/* Accessories Checkboxes */}
          {product.accessories && product.accessories.length > 0 && (
            <div className={styles.accessoriesSection} style={{ marginTop: '20px' }}>
              <h3>Recommended Add-Ons</h3>
              <div className={styles.accessoriesList}>
                {product.accessories.map((acc: any, idx: number) => (
                  <label key={idx} className={`${styles.accLabel} glass`}>
                    <input
                      type="checkbox"
                      checked={checkedAccessories.includes(acc.accessoryName)}
                      onChange={() => toggleAccessory(acc.accessoryName)}
                    />
                    <div className={styles.accMeta}>
                      <span>{acc.accessoryName}</span>
                      <strong>+ ₹{parseFloat(acc.accessoryPrice)}</strong>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Cart Buttons */}
          <div className={styles.actionRow} style={{ marginTop: '24px' }}>
            <button
              className="btn btnSecondary"
              onClick={() => handleCartAdd(false)}
              disabled={selectedStock === 0}
              style={{
                opacity: selectedStock !== 0 ? 1 : 0.5,
                cursor: selectedStock !== 0 ? 'pointer' : 'not-allowed'
              }}
            >
              <ShoppingCart size={18} /> {selectedStock !== 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            {!isAccessory && (
              <button
                className="btn btnSecondary"
                onClick={handleToggleCompare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ArrowLeftRight size={18} />
                {compareItems.some((i: any) => i.id === product.id) ? 'Remove Compare' : 'Add to Compare'}
              </button>
            )}
            <button
              className="btn btnPrimary"
              onClick={() => handleCartAdd(true)}
              disabled={selectedStock === 0}
              style={{
                opacity: selectedStock !== 0 ? 1 : 0.5,
                cursor: selectedStock !== 0 ? 'pointer' : 'not-allowed'
              }}
            >
              {selectedStock !== 0 ? 'Buy Now' : 'Temporarily Unavailable'}
            </button>
          </div>
        </div>
      </div>

      {/* Technical Specifications Grid */}
      {(() => {
        if (isAccessory) {
          const spec = product.specifications || {};
          return (
            <section className={`${styles.specsSection} glass`} style={{ padding: '24px', borderRadius: 'var(--radius-md)', margin: 0 }}>
              <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Accessory Specifications</h2>
              <div className={styles.specsGrid}>
                <div className={styles.specCategory}>
                  <h3>General & Compatibility</h3>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Brand</span>
                    <span className={styles.specValue}>{product.brand?.name || product.brand || 'Xiaomi'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Product Name</span>
                    <span className={styles.specValue}>{product.name}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Category / Type</span>
                    <span className={styles.specValue}>{product.accessoryType?.name || 'Mobile Accessory'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Selected Color</span>
                    <span className={styles.specValue}>{selectedColor || 'Standard'}</span>
                  </div>
                </div>
                <div className={styles.specCategory}>
                  <h3>Build & Features</h3>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Compatibility</span>
                    <span className={styles.specValue}>{spec.compatibility || 'Universal Smartphone Compatible'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Material</span>
                    <span className={styles.specValue}>{spec.material || 'Premium Durable Polycarbonate'}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Warranty</span>
                    <span className={styles.specValue}>{spec.warranty || '1 Year Manufacturer Warranty'}</span>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        const specs = getParsedSpecs(product);
        return (
          <section className={`${styles.specsSection} glass`} style={{ padding: '24px', borderRadius: 'var(--radius-md)', margin: 0 }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Technical Specifications</h2>
            <div className={styles.specsGrid}>
              {/* Card 1: Device Profile & Display */}
              <div className={styles.specCategory}>
                <h3>Device & Screen profile</h3>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Brand</span>
                  <span className={styles.specValue}>{product.brand?.name || product.brand}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Model Name</span>
                  <span className={styles.specValue}>{product.name || product.modelName}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Display details</span>
                  <span className={styles.specValue}>{specs.display}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Refresh Rate</span>
                  <span className={styles.specValue}>{specs.refreshRate}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Operating System</span>
                  <span className={styles.specValue}>{specs.operatingSystem}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Warranty</span>
                  <span className={styles.specValue}>{specs.warranty}</span>
                </div>
              </div>

              {/* Card 2: Hardware & Camera Setup */}
              <div className={styles.specCategory}>
                <h3>Hardware Power & Camera setup</h3>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Processor (CPU)</span>
                  <span className={styles.specValue}>{specs.processor}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Battery Capacity</span>
                  <span className={styles.specValue}>{specs.battery}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Charging Speed</span>
                  <span className={styles.specValue}>{specs.charging}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Rear Camera Setup</span>
                  <span className={styles.specValue}>{specs.rearCamera}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Front Camera Setup</span>
                  <span className={styles.specValue}>{specs.frontCamera}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Network Support</span>
                  <span className={styles.specValue}>{specs.network}</span>
                </div>
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>SIM Card Configuration</span>
                  <span className={styles.specValue}>{specs.simType}</span>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Reviews list and review adder */}
      <section className={styles.reviewsSection}>
        <h2>Customer Reviews ({reviewsList.length})</h2>
        <div className={styles.reviewsGrid}>
          {/* Review form */}
          <div className={`${styles.reviewFormCard} glass`}>
            <h3>Write a Review</h3>
            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
              <div className={styles.ratingSelect}>
                <span>Rating:</span>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewRating(num)}
                    className={reviewRating >= num ? styles.starActive : styles.starInactive}
                  >
                    <Star size={16} fill={reviewRating >= num ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share your experience using this smartphone..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
              />
              <button type="submit" className="btn btnPrimary">Submit Review</button>
            </form>
          </div>

          {/* Reviews loop */}
          <div className={styles.reviewsList}>
            {reviewsList.map((rev) => (
              <div key={rev.id} className={`${styles.reviewCard} glass`}>
                <div className={styles.revHeader}>
                  <strong>{rev.user?.name || 'Customer'}</strong>
                  <div className={styles.revStars}>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        size={14}
                        fill={idx < rev.rating ? 'var(--warning)' : 'none'}
                        color={idx < rev.rating ? 'var(--warning)' : 'var(--foreground-secondary)'}
                      />
                    ))}
                  </div>
                </div>
                <p className={styles.revComment}>{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
