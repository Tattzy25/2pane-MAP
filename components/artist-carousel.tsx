"use client";

import { ItemCarousel } from "@/components/tool-ui/item-carousel";

export function ArtistCarousel() {
  return (
    <ItemCarousel
      id="item-carousel-artists"
      items={[
        {
          id: "artist-1",
          name: "Maya Chen",
          subtitle: "Neo-Traditional",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/images.jpg?v=1771864130",
          rating: 4.9,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-2",
          name: "Jake Rivers",
          subtitle: "Blackwork",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/profile-picture.webp?v=1771864130",
          rating: 4.8,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-3",
          name: "Luna Vex",
          subtitle: "Fine Line",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/ce2fc7b3-fb9d-4186-bbac-194bbad4aacf.webp?v=1771864129",
          rating: 5.0,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-4",
          name: "Dex Monroe",
          subtitle: "Geometric",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/download.jpg?v=1771864350",
          rating: 4.8,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-5",
          name: "Ivy Pierce",
          subtitle: "Japanese",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/pexels-olly-3914473.jpg?v=1771863936",
          rating: 4.9,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-6",
          name: "Atlas Stone",
          subtitle: "Realism",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/pexels-shkrabaanthony-7005736.jpg?v=1771863939",
          rating: 4.7,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-7",
          name: "Sierra Blake",
          subtitle: "Watercolor",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/tattoo-artist-auburn-hair-studio-683x1024.jpg?v=1771864350",
          rating: 4.9,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
        {
          id: "artist-8",
          name: "Raven Cross",
          subtitle: "Traditional",
          image: "https://cdn.shopify.com/s/files/1/0649/4155/5787/files/rs_w_600_h_800_cg_true.webp?v=1771863935",
          rating: 4.6,
          actions: [
            {
              id: "contact",
              label: "Contact",
            },
          ],
        },
      ]}
      onItemClick={(itemId) => console.log("Clicked:", itemId)}
      onItemAction={(itemId, actionId) => {
        console.log("Action:", itemId, actionId);
        // TODO: Open socials contact card
      }}
    />
  );
}