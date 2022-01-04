/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-key */
import { Box, Checkbox, Flex } from '@chakra-ui/react'
import { Answer, Result } from 'bot-engine'
import { useTypebot } from 'contexts/TypebotContext'
import React, { useEffect, useRef } from 'react'
import { Hooks, useFlexLayout, useRowSelect, useTable } from 'react-table'
import { parseSubmissionsColumns } from 'services/publicTypebot'
import { parseDateToReadable } from 'services/results'
import { LoadingRows } from './LoadingRows'

const defaultCellWidth = 180

type SubmissionsTableProps = {
  results?: (Result & { answers: Answer[] })[]
  hasMore?: boolean
  onNewSelection: (selection: string[]) => void
  onScrollToBottom: () => void
}

export const SubmissionsTable = ({
  results,
  hasMore,
  onNewSelection,
  onScrollToBottom,
}: SubmissionsTableProps) => {
  const { publishedTypebot } = useTypebot()
  const columns: any = React.useMemo(
    () => parseSubmissionsColumns(publishedTypebot),
    [publishedTypebot]
  )
  const data = React.useMemo(
    () =>
      (results ?? []).map((result) => ({
        createdAt: parseDateToReadable(result.createdAt),
        ...result.answers.reduce(
          (o, answer) => ({ ...o, [answer.blockId]: answer.content }),
          {}
        ),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [results?.length]
  )
  const bottomElement = useRef<HTMLDivElement | null>(null)
  const tableWrapper = useRef<HTMLDivElement | null>(null)

  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    getTableBodyProps,
    selectedFlatRows,
  } = useTable(
    { columns, data, defaultColumn: { width: defaultCellWidth } },
    useRowSelect,
    checkboxColumnHook,
    useFlexLayout
  ) as any

  useEffect(() => {
    if (!results) return
    onNewSelection(selectedFlatRows.map((row: any) => results[row.index].id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlatRows])

  useEffect(() => {
    if (!bottomElement.current) return
    const options: IntersectionObserverInit = {
      root: tableWrapper.current,
      threshold: 0,
    }
    const observer = new IntersectionObserver(handleObserver, options)
    if (bottomElement.current) observer.observe(bottomElement.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottomElement.current])

  const handleObserver = (entities: any[]) => {
    const target = entities[0]
    if (target.isIntersecting) onScrollToBottom()
  }

  return (
    <Flex
      overflow="scroll"
      maxW="full"
      maxH="full"
      className="table-wrapper"
      rounded="md"
      data-testid="table-wrapper"
      pb="20"
      ref={tableWrapper}
    >
      <Box as="table" rounded="md" {...getTableProps()} w="full" h="full">
        <Box as="thead" pos="sticky" top="0" zIndex={2}>
          {headerGroups.map((headerGroup: any) => {
            return (
              <Flex as="tr" {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any, idx: number) => {
                  return (
                    <Flex
                      py={2}
                      px={4}
                      border="1px"
                      borderColor="gray.200"
                      as="th"
                      color="gray.500"
                      fontWeight="normal"
                      textAlign="left"
                      bgColor={'white'}
                      {...column.getHeaderProps()}
                      style={{
                        width: idx === 0 ? '50px' : `${defaultCellWidth}px`,
                      }}
                    >
                      {column.render('Header')}
                    </Flex>
                  )
                })}
              </Flex>
            )
          })}
        </Box>

        <Box as="tbody" {...getTableBodyProps()}>
          {rows.map((row: any, idx: number) => {
            prepareRow(row)
            return (
              <Flex
                as="tr"
                {...row.getRowProps()}
                ref={(ref) => {
                  if (results && idx === results.length - 10)
                    bottomElement.current = ref
                }}
              >
                {row.cells.map((cell: any, idx: number) => {
                  return (
                    <Flex
                      py={2}
                      px={4}
                      border="1px"
                      as="td"
                      borderColor="gray.200"
                      bgColor={'white'}
                      {...cell.getCellProps()}
                      style={{
                        width: idx === 0 ? '50px' : `${defaultCellWidth}px`,
                      }}
                    >
                      {cell.render('Cell')}
                    </Flex>
                  )
                })}
              </Flex>
            )
          })}
          {(results === undefined || hasMore === true) && (
            <LoadingRows totalColumns={columns.length} />
          )}
        </Box>
      </Box>
    </Flex>
  )
}

const checkboxColumnHook = (hooks: Hooks<any>) => {
  hooks.visibleColumns.push((columns) => [
    {
      id: 'selection',
      Header: ({ getToggleAllRowsSelectedProps }: any) => (
        <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
      ),
      Cell: ({ row }: any) => (
        <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
      ),
    },
    ...columns,
  ])
}

const IndeterminateCheckbox = React.forwardRef(
  ({ indeterminate, checked, ...rest }: any, ref) => {
    const defaultRef = React.useRef()
    const resolvedRef: any = ref || defaultRef

    return (
      <Checkbox
        ref={resolvedRef}
        {...rest}
        isIndeterminate={indeterminate}
        isChecked={checked}
      />
    )
  }
)