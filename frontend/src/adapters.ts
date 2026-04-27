import { CityLocation } from './const';
import type { CityName, Comment, Location, NewOffer, Offer, User } from './types/types';

type BackendId = string | {_id?: string; id?: string; toString?: () => string; buffer?: unknown};

type BackendUser = {
  id?: BackendId;
  _id?: BackendId;
  name: string;
  email: string;
  avatarPath?: string;
  userType: 'usual' | 'pro';
};

type BackendCity = {
  name: CityName;
  location: Location;
};

type BackendOffer = {
  id?: BackendId;
  _id?: BackendId;
  title: string;
  rentalPrice: number;
  rating: number;
  isPremium: boolean;
  isFavorite: boolean;
  city: BackendCity;
  previewImage: string;
  housingType: Offer['type'];
  roomsCount: number;
  guestsCount: number;
  description?: string;
  amenities?: string[];
  author?: BackendUser;
  authorId?: BackendUser;
  images?: string[];
};

type BackendComment = {
  id?: BackendId;
  _id?: BackendId;
  text: string;
  publishDate: string;
  rating: number;
  author?: BackendUser;
  authorId?: BackendUser;
};

type BackendNewOffer = {
  title: string;
  description: string;
  city: CityName;
  previewImage: string;
  images: string[];
  isPremium: boolean;
  housingType: Offer['type'];
  roomsCount: number;
  guestsCount: number;
  rentalPrice: number;
  amenities: string[];
  coordinates: Location;
};

const DEFAULT_AVATAR = '/img/avatar.svg';
const DEFAULT_IMAGE = '/img/room.jpg';

const getId = (value: BackendId | undefined): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.id ?? value._id ?? value.toString?.() ?? '';
};

export const adaptUser = (user: BackendUser): User => ({
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarPath ?? DEFAULT_AVATAR,
  isPro: user.userType === 'pro',
});

export const adaptOffer = (offer: BackendOffer): Offer => {
  const city = {
    name: offer.city.name,
    location: offer.city.location ?? CityLocation[offer.city.name],
  };

  return {
    id: getId(offer.id ?? offer._id),
    title: offer.title,
    price: offer.rentalPrice,
    rating: offer.rating,
    isPremium: offer.isPremium,
    isFavorite: offer.isFavorite,
    city,
    location: city.location,
    previewImage: offer.previewImage,
    type: offer.housingType,
    bedrooms: offer.roomsCount,
    description: offer.description ?? '',
    goods: offer.amenities ?? [],
    host: adaptUser(offer.author ?? offer.authorId ?? {
      name: '',
      email: '',
      userType: 'usual',
    }),
    images: offer.images?.length ? offer.images : [offer.previewImage || DEFAULT_IMAGE],
    maxAdults: offer.guestsCount,
  };
};

export const adaptComment = (comment: BackendComment): Comment => ({
  id: getId(comment.id ?? comment._id),
  comment: comment.text,
  date: comment.publishDate,
  rating: comment.rating,
  user: adaptUser(comment.author ?? comment.authorId ?? {
    name: '',
    email: '',
    userType: 'usual',
  }),
});

export const adaptNewOfferToBackend = (offer: NewOffer): BackendNewOffer => ({
  title: offer.title,
  description: offer.description,
  city: offer.city.name,
  previewImage: offer.previewImage,
  images: Array.from({ length: 6 }, () => offer.previewImage || DEFAULT_IMAGE),
  isPremium: offer.isPremium,
  housingType: offer.type,
  roomsCount: offer.bedrooms,
  guestsCount: offer.maxAdults,
  rentalPrice: offer.price,
  amenities: offer.goods,
  coordinates: offer.location,
});

export type { BackendComment, BackendOffer, BackendUser };
