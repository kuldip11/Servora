import type { AuthContext } from "@/core/auth";
import { requirePermission } from "@/core/auth";
import { InternalError, NotFoundError } from "@/core/errors";
import { orderRepository } from "@/modules/orders/order.repository";
import {
  pricingPipeline,
  type PricingReplayEvidence,
} from "@/modules/orders/pricing/pricing-pipeline";
import {
  availabilityService,
  type AvailabilityReplayEvidence,
} from "@/modules/menu/availability/availability.service";
import { menuChangeLog } from "@/modules/menu/change-log/menu-change-log";

const money = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const replayPersistedLine = (item: {
  quantity: number;
  unitPrice: string;
  subtotal: string;
  pricingAttribution: {
    BASE_PRICE: number;
    VARIANT: number;
    MODIFIER: number;
    COMBO?: number;
    PROMOTION?: number;
    LOYALTY?: number;
    PRICE_SOURCE?: { kind: string; id: string; description: string };
  } | null;
}) => {
  const attribution = item.pricingAttribution ?? {
    BASE_PRICE: Number(item.unitPrice),
    VARIANT: 0,
    MODIFIER: 0,
  };
  const persistedSubtotal = Number(item.subtotal);
  const comboDelta = attribution.COMBO ?? 0;
  const preComboSubtotal = money(persistedSubtotal - comboDelta);
  const replayedPreComboSubtotal = money(
    (attribution.BASE_PRICE + attribution.MODIFIER) * item.quantity,
  );
  const replayedSubtotal = money(replayedPreComboSubtotal + comboDelta);
  const promotion = attribution.PROMOTION ?? 0;
  const loyalty = attribution.LOYALTY ?? 0;
  const payableBeforeTax = money(
    Math.max(0, persistedSubtotal + promotion + loyalty),
  );
  return {
    priceSource: attribution.PRICE_SOURCE ?? null,
    baseResolvedUnitPrice: attribution.BASE_PRICE,
    variantDelta: attribution.VARIANT,
    modifierDelta: attribution.MODIFIER,
    comboDelta,
    promotionDelta: promotion,
    loyaltyDelta: loyalty,
    replayedPreComboSubtotal,
    preComboSubtotal,
    replayedSubtotal,
    persistedSubtotal: money(persistedSubtotal),
    payableBeforeTax,
    matchesSnapshot:
      replayedPreComboSubtotal === preComboSubtotal &&
      replayedSubtotal === money(persistedSubtotal),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isPricingReplayEvidence = (
  value: unknown,
): value is PricingReplayEvidence => {
  if (!isRecord(value)) return false;
  const line = value.requestedLine;
  const item = value.item;
  return (
    isRecord(line) &&
    typeof line.menuItemId === "string" &&
    typeof line.quantity === "number" &&
    isRecord(item) &&
    typeof item.id === "string" &&
    Array.isArray(value.priceRules)
  );
};

const isAvailabilityReplayEvidence = (
  value: unknown,
): value is AvailabilityReplayEvidence => {
  if (!isRecord(value)) return false;
  const item = value.item;
  const resolvedStatus = value.resolvedStatus;
  return (
    isRecord(item) &&
    typeof item.id === "string" &&
    isRecord(resolvedStatus) &&
    typeof resolvedStatus.status === "string" &&
    typeof resolvedStatus.reason === "string"
  );
};

export const orderExplainService = {
  async explainOrder(auth: AuthContext, orderId: string) {
    requirePermission(auth, "orders:read");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw new NotFoundError("Order", orderId);

    const orderAsOf = order.resolutionAsOf ?? order.createdAt;
    const lines = [];

    for (const item of order.items) {
      if (!item.resolutionAsOf) {
        throw new InternalError("Order replay evidence is incomplete");
      }
      const lineAsOf = item.resolutionAsOf;
      const persistedReplay = replayPersistedLine(item);

      if (!item.menuItemId) {
        lines.push({
          orderItemId: item.id,
          name: item.menuItemName,
          asOf: lineAsOf.toISOString(),
          historicalEvidenceComplete: true,
          snapshotPrice: Number(item.unitPrice),
          pricingReplay: persistedReplay,
          trace: [
            {
              stage: "CONTEXT",
              explanation: `Grouping line resolved at ${lineAsOf.toISOString()}.`,
            },
            {
              stage: "PRICING_PIPELINE",
              explanation:
                "Combo/cover grouping value is preserved on the immutable order line.",
              attribution: item.pricingAttribution ?? {},
            },
            {
              stage: "SNAPSHOT",
              explanation:
                "Grouping lines do not have an availability resolver result because they are not menu items.",
            },
          ],
        });
        continue;
      }

      const changes = await menuChangeLog.list(auth.tenantId, {
        entityId: item.menuItemId,
        before: new Date(lineAsOf.getTime() + 1),
        limit: 20,
      });
      const availability = item.availabilitySnapshot ?? null;
      const pricingEvidence = isPricingReplayEvidence(
        item.pricingReplayEvidence,
      )
        ? item.pricingReplayEvidence
        : null;
      const availabilityEvidence = isAvailabilityReplayEvidence(
        item.availabilityReplayEvidence,
      )
        ? item.availabilityReplayEvidence
        : null;

      if (!availability || !pricingEvidence || !availabilityEvidence) {
        throw new InternalError("Order replay evidence is incomplete");
      }

      let authoritativePricingReplay: {
        unitPrice: number;
        subtotal: number;
        taxRate: number;
        matchesSnapshot: boolean;
      } | null = null;
      let authoritativeAvailabilityReplay: {
        effectiveStatus: string;
        isHidden: boolean;
        availabilityReason: string | null;
        availabilityCause: string;
        matchesSnapshot: boolean;
      } | null = null;

      {
        const replayedAvailability = await availabilityService.getEffectiveItem(
          auth.tenantId,
          item.menuItemId,
          availability.branchId,
          {
            channel: availability.channel,
            fulfillmentType:
              availability.fulfillmentType === "UNSCOPED"
                ? order.type
                : availability.fulfillmentType,
            asOf: lineAsOf,
            historicalReplay: availabilityEvidence,
          },
        );
        authoritativeAvailabilityReplay = {
          effectiveStatus: replayedAvailability.effectiveStatus,
          isHidden: replayedAvailability.isHidden,
          availabilityReason: replayedAvailability.availabilityReason ?? null,
          availabilityCause: replayedAvailability.availabilityCause,
          matchesSnapshot:
            replayedAvailability.effectiveStatus ===
              availability.effectiveStatus &&
            replayedAvailability.isHidden === availability.isHidden &&
            (replayedAvailability.availabilityReason ?? null) ===
              availability.reason &&
            replayedAvailability.availabilityCause === availability.cause,
        };

        const replayedPricing = await pricingPipeline.price(
          {
            tenantId: auth.tenantId,
            branchId: availability.branchId,
            channel: availability.channel,
            fulfillmentType:
              availability.fulfillmentType === "UNSCOPED"
                ? order.type
                : availability.fulfillmentType,
            ...(order.customerId ? { customerId: order.customerId } : {}),
            ...(order.customerGroupId
              ? { customerGroupId: order.customerGroupId }
              : {}),
            asOf: lineAsOf,
            allowUnavailable: true,
            historicalReplay: pricingEvidence,
          },
          [pricingEvidence.requestedLine],
        );
        const replayedLine = replayedPricing.lines[0];
        if (!replayedLine) {
          throw new InternalError("Order pricing replay produced no line");
        }
        const expectedBaseSubtotal = money(
          Number(item.subtotal) - (item.pricingAttribution?.COMBO ?? 0),
        );
        const expectedBaseUnitPrice = money(
          expectedBaseSubtotal / item.quantity,
        );
        authoritativePricingReplay = {
          unitPrice: money(replayedLine.unitPrice),
          subtotal: money(replayedLine.subtotal),
          taxRate: money(replayedLine.taxRate),
          matchesSnapshot:
            money(replayedLine.unitPrice) === expectedBaseUnitPrice &&
            money(replayedLine.subtotal) === expectedBaseSubtotal &&
            money(replayedLine.taxRate) === money(Number(item.taxRate)),
        };
      }

      const historicalEvidenceComplete = Boolean(
        authoritativePricingReplay?.matchesSnapshot &&
        authoritativeAvailabilityReplay?.matchesSnapshot,
      );

      lines.push({
        orderItemId: item.id,
        menuItemId: item.menuItemId,
        name: item.menuItemName,
        asOf: lineAsOf.toISOString(),
        historicalEvidenceComplete,
        snapshotPrice: Number(item.unitPrice),
        snapshotTaxRate: Number(item.taxRate),
        pricingAttribution: item.pricingAttribution ?? {},
        pricingReplay: persistedReplay,
        authoritativePricingReplay,
        availabilityAtOrder: availability,
        authoritativeAvailabilityReplay,
        trace: [
          {
            stage: "CONTEXT",
            explanation: `Resolved for ${availability.channel}/${availability.fulfillmentType} at ${availability.asOf} in branch ${availability.branchId}.`,
          },
          {
            stage: "AVAILABILITY_RESOLVER_REPLAY",
            explanation: authoritativeAvailabilityReplay.matchesSnapshot
              ? "AvailabilityResolver re-ran against immutable fire-time inputs and exactly matched the stored availability snapshot."
              : "AvailabilityResolver replay differed from the stored availability snapshot.",
            replay: authoritativeAvailabilityReplay,
          },
          {
            stage: "PRICING_PIPELINE_STAGE_1",
            explanation:
              persistedReplay.priceSource?.description ??
              "Menu-item base price attribution",
            source: persistedReplay.priceSource,
          },
          {
            stage: "PRICING_PIPELINE_REPLAY",
            explanation: authoritativePricingReplay.matchesSnapshot
              ? "PricingPipeline re-ran against immutable fire-time inputs and exactly matched the stored base line price/tax snapshot."
              : "PricingPipeline replay differed from the stored base line snapshot.",
            replay: authoritativePricingReplay,
          },
          ...changes.map((event) => ({
            stage: "CHANGE_EVENT",
            explanation: `${event.entityType} ${event.changeType} at ${event.changedAt.toISOString()}`,
            eventId: event.id,
            diff: event.diff,
          })),
          {
            stage: "SNAPSHOT",
            explanation: `Charged line snapshot ${Number(item.unitPrice).toFixed(2)} with ${Number(item.taxRate).toFixed(2)}% tax. Later menu edits cannot change these values or the captured resolver inputs.`,
          },
        ],
      });
    }

    return {
      orderId,
      asOf: orderAsOf.toISOString(),
      completeHistory: lines.every((line) => line.historicalEvidenceComplete),
      historyNotice: lines.every((line) => line.historicalEvidenceComplete)
        ? "Deterministic AvailabilityResolver and PricingPipeline replay matched every fire-time snapshot."
        : "Replay evidence is present for every line, but one or more resolver results differ from the stored fire-time snapshot.",
      totals: {
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        taxAmount: Number(order.taxAmount),
        serviceChargeAmount: Number(order.serviceChargeAmount),
        roundingAdjustment: Number(order.roundingAdjustment),
        totalAmount: Number(order.totalAmount),
      },
      lines,
    };
  },
};
