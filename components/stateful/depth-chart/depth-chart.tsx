"use client"
import { type Market } from "@mangrovedao/mangrove.js"
import { curveStepAfter, curveStepBefore } from "@visx/curve"
import { LinearGradient } from "@visx/gradient"
import {
  AreaSeries,
  Axis,
  DataProvider,
  EventEmitterProvider,
  Grid,
  LineSeries,
  Tooltip,
  XYChart,
} from "@visx/xychart"
import Big from "big.js"

import { Spinner } from "@/components/ui/spinner"
import { lerp } from "@/utils/interpolation"
import { Skeleton } from "@components/ui/skeleton"
import { DataKeyType } from "./enums"
import {
  borderVar,
  borderWidthVar,
  crosshairStyle,
  greenColorVar,
  redColorVar,
  theme,
} from "./theme"
import { useDepthChart } from "./use-depth-chart"
import {
  formatNumber,
  getNumTicksBasedOnDecimals,
  toNumberIfBig,
} from "./utils"

const accessors = {
  xAccessor: (offer: Market.Offer) => toNumberIfBig(offer.price),
  yAccessor: (offer: Market.Offer) => toNumberIfBig(offer.volume),
}

export default function DepthChart() {
  const {
    cumulativeAsks,
    cumulativeBids,
    domain,
    midPrice,
    onDepthChartZoom,
    range,
    zoomDomain,
    lowestAsk,
    highestBid,
    isScrolling,
    onMouseOut,
    onMouseOver,
    onMouseMove,
    baseDecimals,
    priceDecimals,
    selectedMarket,
    asks,
    bids,
    isLoading,
  } = useDepthChart()

  if (
    asks?.length === 0 &&
    bids?.length === 0 &&
    !isLoading &&
    !!selectedMarket
  ) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        Empty market
      </div>
    )
  }

  if (!(zoomDomain && midPrice) || isLoading) {
    return (
      <Skeleton className="w-full h-full flex justify-center items-center text-green-caribbean">
        <Spinner />
      </Skeleton>
    )
  }

  return (
    <div
      className="w-full h-full overflow-hidden select-none cursor-crosshair"
      onWheel={onDepthChartZoom}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
      onMouseMove={onMouseMove}
    >
      <DataProvider
        theme={theme}
        xScale={{
          type: "linear",
          clamp: false,
          nice: false,
          zero: false,
          domain: [
            lerp(domain[0], domain[1], 0.01),
            lerp(domain[0], domain[1], 1),
          ],
        }}
        yScale={{
          type: "linear",
          clamp: true,
          nice: true,
          zero: true,
          domain: [range[0], lerp(...range, 1.1)],
        }}
      >
        <EventEmitterProvider>
          <XYChart
            margin={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 16,
            }}
          >
            <Axis
              orientation="bottom"
              numTicks={getNumTicksBasedOnDecimals(zoomDomain)}
              tickFormat={(n) => formatNumber(n, zoomDomain >= 500)}
            />
            <Grid
              numTicks={4}
              lineStyle={{
                stroke: borderVar,
                strokeWidth: borderWidthVar,
              }}
            />

            {[
              {
                dataKey: DataKeyType.BIDS,
                data: cumulativeBids.length
                  ? [
                      { ...highestBid, volume: Big(0) },
                      ...cumulativeBids,
                      { price: Big(0), volume: Big(0) },
                    ].reverse()
                  : [],
                color: greenColorVar,
                curve: curveStepBefore,
              },
              {
                dataKey: DataKeyType.ASKS,
                data: cumulativeAsks.length
                  ? [{ ...lowestAsk, volume: Big(0) }, ...cumulativeAsks]
                  : [],
                color: redColorVar,
                curve: curveStepAfter,
              },
            ].map((props) => (
              <g key={`${props.dataKey}-group`}>
                <AreaSeries
                  {...props}
                  xAccessor={(offer: Partial<Market.Offer>) =>
                    Big(offer?.price ?? 0).toNumber()
                  }
                  yAccessor={(offer: Partial<Market.Offer>) =>
                    Big(offer?.volume ?? 0).toNumber()
                  }
                  lineProps={{ strokeWidth: 1 }}
                  fillOpacity={0.15}
                  fill={`url(#${props.dataKey}-gradient)`}
                  renderLine={true}
                />
                <LinearGradient
                  id={`${props.dataKey}-gradient`}
                  from={props.color}
                  to={props.color}
                  toOpacity={0.35}
                />
              </g>
            ))}
            <LineSeries
              dataKey={DataKeyType.MID_PRICE}
              data={[1.2, 0.5, 0].map((volumeMultiplier) => ({
                price: midPrice,
                volume: lerp(...range, volumeMultiplier),
              }))}
              xAccessor={(x) => x?.price.toNumber()}
              yAccessor={(x) => x?.volume}
              strokeWidth={0.25}
            />
            {!isScrolling && (
              <Tooltip<Market.Offer>
                unstyled
                detectBounds={true}
                applyPositionStyle
                snapTooltipToDatumX
                snapTooltipToDatumY
                showHorizontalCrosshair
                showVerticalCrosshair
                verticalCrosshairStyle={crosshairStyle}
                horizontalCrosshairStyle={crosshairStyle}
                style={{
                  zIndex: 999,
                  background: "transparent",
                }}
                showDatumGlyph={true}
                renderTooltip={({ tooltipData, colorScale }) => {
                  if (
                    !(
                      tooltipData?.nearestDatum &&
                      tooltipData?.nearestDatum.datum &&
                      colorScale
                    )
                  )
                    return
                  const key = tooltipData.nearestDatum.key
                  const color = colorScale(key)
                  const price = accessors.xAccessor(
                    tooltipData.nearestDatum.datum,
                  )
                  const volume = accessors.yAccessor(
                    tooltipData.nearestDatum.datum,
                  )
                  const [min, max] = domain
                  const isOutside = price < min || price > max
                  if (
                    (key !== DataKeyType.MID_PRICE.toString() &&
                      (!price || !volume)) ||
                    isOutside
                  )
                    return

                  // Do not show tooltip for midPrice if there is no asks or bids, cause midPrice would be 0 in that case
                  if (
                    key === DataKeyType.MID_PRICE.toString() &&
                    (!cumulativeAsks?.length || !cumulativeBids?.length)
                  ) {
                    return
                  }

                  return (
                    <div className="border bg-black p-4 rounded-md">
                      {price ? (
                        <div>
                          <b>
                            {key !== DataKeyType.MID_PRICE.toString()
                              ? "Price"
                              : "Mid price"}
                            :
                          </b>{" "}
                          {price.toFixed(priceDecimals)}{" "}
                          {selectedMarket?.quote.name}
                        </div>
                      ) : undefined}
                      {key !== DataKeyType.MID_PRICE.toString() && (
                        <div>
                          <b className="capitalize" style={{ color }}>
                            {key.slice(0, -1)}:
                          </b>{" "}
                          <span>
                            {volume.toFixed(baseDecimals)}{" "}
                            {selectedMarket?.base.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                }}
              />
            )}
          </XYChart>
        </EventEmitterProvider>
      </DataProvider>
    </div>
  )
}
