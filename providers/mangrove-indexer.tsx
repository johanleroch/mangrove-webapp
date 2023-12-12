"use client"

import { getSdk } from "@mangrovedao/indexer-sdk"
import type { Chains } from "@mangrovedao/indexer-sdk/dist/src/types/types"
import { TickPriceHelper } from "@mangrovedao/mangrove.js"
import { useQuery } from "@tanstack/react-query"
import React from "react"
import { useNetwork } from "wagmi"
import useMangrove from "./mangrove"

const useIndexerSdkContext = () => {
  const { marketsInfoQuery, mangrove } = useMangrove()
  const { chain } = useNetwork()

  const indexerSdkQuery = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["indexer-sdk", chain?.network, marketsInfoQuery.dataUpdatedAt],
    queryFn: () => {
      if (!(chain?.network && marketsInfoQuery.data)) return null
      const chainName = chain.network as Chains
      return getSdk({
        chainName,
        helpers: {
          getTokenDecimals: async (address) => {
            const token = await mangrove?.tokenFromAddress(address)
            if (!token)
              throw new Error("Impossible to determine token decimals")
            return token.decimals
          },
          createTickHelpers: (ba, m) => {
            const marketInfo = marketsInfoQuery?.data?.find(
              (t) =>
                t.base.address.toLowerCase() === m.base.address.toLowerCase() &&
                t.quote.address.toLowerCase() === m.quote.address.toLowerCase(),
            )
            if (!(mangrove && marketInfo)) {
              throw new Error("Impossible to determine token decimals")
            }
            return new TickPriceHelper(ba, marketInfo)
          },
        },
      })
    },
    meta: {
      error: "Error when initializing the indexer sdk",
    },
  })
  return {
    indexerSdkQuery,
    indexerSdk: indexerSdkQuery.data,
  }
}

const IndexerSdkContext = React.createContext<
  ReturnType<typeof useIndexerSdkContext> | undefined
>(undefined)
IndexerSdkContext.displayName = "IndexerSdkContext"

export function IndexerSdkProvider({ children }: React.PropsWithChildren) {
  const indexerSdkContext = useIndexerSdkContext()
  return (
    <IndexerSdkContext.Provider value={indexerSdkContext}>
      {children}
    </IndexerSdkContext.Provider>
  )
}

const useIndexerSdk = () => {
  const indexerSdkCtx = React.useContext(IndexerSdkContext)
  if (!indexerSdkCtx) {
    throw new Error(
      "useIndexerSdk must be used within the IndexerSdkContext.Provider",
    )
  }
  return indexerSdkCtx
}

export default useIndexerSdk
