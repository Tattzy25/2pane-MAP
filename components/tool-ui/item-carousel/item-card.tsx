"use client";

import { cn, Button, Card } from "./_adapter";
import type { Item } from "./schema";

interface ItemCardProps {
  item: Item;
  onItemClick?: (itemId: string) => void;
  onItemAction?: (itemId: string, actionId: string) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <svg
            key={star}
            className={cn(
              "h-2 w-2 sm:h-2.5 sm:w-2.5",
              filled ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"
            )}
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
      <span className="ml-0.5 text-[9px] font-medium sm:text-[10px]">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ItemCard({ item, onItemClick, onItemAction }: ItemCardProps) {
  const { id, name, subtitle, image, color, rating, actions } = item;
  const isCardInteractive = typeof onItemClick === "function";

  const handleCardClick = () => {
    if (!isCardInteractive) return;
    onItemClick?.(id);
  };

  const handleActionClick = (actionId: string) => {
    onItemAction?.(id, actionId);
  };

  return (
    <Card
      className={cn(
        "group @container/card relative flex min-w-[100px] w-[22vw] max-w-[140px] flex-col gap-0 self-stretch overflow-clip rounded-xl border-0 p-0 shadow-none",
        "sm:w-[18vw] sm:max-w-[150px] sm:rounded-2xl",
        "md:w-[15vw] md:max-w-[160px]",
        isCardInteractive && "cursor-pointer",
        "touch-manipulation",
      )}
    >
      {isCardInteractive && (
        <button
          type="button"
          aria-label={`View item: ${name}`}
          className={cn(
            "absolute inset-0 z-10 rounded-xl sm:rounded-2xl",
            "cursor-pointer touch-manipulation",
            "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          )}
          onClick={handleCardClick}
        />
      )}

      <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-t-xl sm:rounded-t-2xl">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={cn(
              "h-full w-full object-cover transition-transform duration-200",
              isCardInteractive && "group-hover:scale-105",
            )}
          />
        ) : (
          <div
            className={cn(
              "h-full w-full transition-transform duration-200",
              isCardInteractive && "group-hover:scale-105",
            )}
            style={color ? { backgroundColor: color } : undefined}
            role="img"
            aria-label={name}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5 p-1.5 sm:p-2">
        <div className="flex flex-col gap-0">
          <h3 className="line-clamp-1 text-[10px] leading-tight font-medium sm:text-xs">
            {name}
          </h3>

          {subtitle && (
            <p className="text-muted-foreground line-clamp-1 text-[9px] sm:text-[10px]">
              {subtitle}
            </p>
          )}

          {rating !== undefined && <StarRating rating={rating} />}
        </div>

        {actions && actions.length > 0 && (
          <div
            className={cn(
              "relative z-20 mt-auto flex flex-col-reverse gap-1 pt-1 @[120px]/card:flex-row @[120px]/card:gap-1.5",
            )}
          >
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.variant ?? "default"}
                size="sm"
                disabled={action.disabled}
                className="h-6 min-h-6 w-full rounded-lg px-1.5 text-[9px] @[120px]/card:h-7 @[120px]/card:w-auto @[120px]/card:flex-1 @[120px]/card:px-2 @[120px]/card:text-[10px]"
                onClick={() => handleActionClick(action.id)}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}