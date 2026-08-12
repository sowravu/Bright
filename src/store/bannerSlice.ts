import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BannerData {
  title: string;
  description: string;
  badge: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  showSecondaryBtn: boolean;
  templateName: string;
  isActive: boolean;
}

interface BannerState extends BannerData {
  hydrated: boolean;
}

const defaultBanner: BannerData = {
  title: 'Welcome to Bright Mobile',
  description:
    'Discover premium smartphones, wireless earbuds, fast chargers, and accessories with official brand warranty.',
  badge: 'Official Mobile & Accessories Store',
  image: '',
  ctaText: 'Explore Catalog',
  ctaLink: '/products',
  buttonColor: '#2563eb',
  buttonTextColor: '#ffffff',
  secondaryCtaText: 'Admin Store Manager',
  secondaryCtaLink: '/admin',
  showSecondaryBtn: false,
  templateName: 'default',
  isActive: true,
};

const initialState: BannerState = {
  ...defaultBanner,
  hydrated: false,
};

const bannerSlice = createSlice({
  name: 'banner',
  initialState,
  reducers: {
    setBanner(state, action: PayloadAction<Partial<BannerData>>) {
      Object.assign(state, action.payload);
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        const currentStored = {
          title: state.title,
          description: state.description,
          badge: state.badge,
          image: state.image,
          ctaText: state.ctaText,
          ctaLink: state.ctaLink,
          buttonColor: state.buttonColor,
          buttonTextColor: state.buttonTextColor,
          secondaryCtaText: state.secondaryCtaText,
          secondaryCtaLink: state.secondaryCtaLink,
          showSecondaryBtn: state.showSecondaryBtn,
          templateName: state.templateName,
          isActive: state.isActive,
        };
        localStorage.setItem('bright_banner', JSON.stringify(currentStored));
      }
    },
    resetBannerState(state) {
      Object.assign(state, defaultBanner);
      state.hydrated = true;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bright_banner');
      }
    },
    rehydrateBanner(state) {
      if (typeof window !== 'undefined') {
        const storedBanner = localStorage.getItem('bright_banner');
        if (storedBanner) {
          try {
            const parsed = JSON.parse(storedBanner);
            Object.assign(state, parsed);
          } catch (_) {}
        }
      }
      state.hydrated = true;
    },
  },
});

export const { setBanner, resetBannerState, rehydrateBanner } = bannerSlice.actions;
export default bannerSlice.reducer;
