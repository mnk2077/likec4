import type { scalar } from '@likec4/core'
import { LikeC4Diagram } from '@likec4/diagram'
import { IconRenderer } from '@likec4/icons/all'
import { Box, Button, Group, Loader, LoadingOverlay, Notification, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { likec4Container, likec4ParsingScreen, stateAlert } from './App.css'
import { changeViewId, refetchCurrentDiagram, setLastClickedNode, useLikeC4View, useVscodeAppState } from './state'
import { ExtensionApi as extensionApi } from './vscode'

const ErrorMessage = ({ error }: { error: string | null }) => (
  <Box className={stateAlert}>
    <Notification
      icon={<IconX style={{ width: 20, height: 20 }} />}
      styles={{
        icon: {
          alignSelf: 'flex-start',
        },
      }}
      color={'red'}
      title={'Oops, something went wrong'}
      withCloseButton={false}>
      <Text
        style={{
          whiteSpace: 'preserve-breaks',
        }}>
        {error ?? 'Unknown error'}
      </Text>
      <Group gap={'xs'} mt="sm">
        <Button color="gray" variant="light" onClick={() => refetchCurrentDiagram()}>Refresh</Button>
        <Button color="gray" variant="subtle" onClick={extensionApi.closeMe}>Close</Button>
      </Group>
    </Notification>
  </Box>
)

export default function App() {
  const [{
    nodesDraggable,
    edgesEditable,
  }] = useVscodeAppState()

  const {
    state,
    view,
    error,
  } = useLikeC4View()

  // Debounce loading state to prevent flickering
  const [isLoading] = useDebouncedValue(state === 'pending' || state === 'stale', 100)

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {state === 'error' && <ErrorMessage error={error} />}
        {state !== 'error' && (
          <section>
            <p>Parsing your model...</p>
            <Loader />
            <p>
              <Button color="gray" onClick={extensionApi.closeMe}>
                Close
              </Button>
            </p>
          </section>
        )}
      </div>
    )
  }
  return (
    <>
      <div className={likec4Container} data-vscode-context='{"preventDefaultContextMenuItems": true}'>
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{ blur: 1, backgroundOpacity: 0.1 }} />
        <LikeC4Diagram
          view={view}
          fitViewPadding={'32px'}
          readonly={false}
          controls
          nodesDraggable={nodesDraggable}
          experimentalEdgeEditing={edgesEditable}
          enableFocusMode
          enableDynamicViewWalkthrough
          enableElementDetails
          enableRelationshipBrowser
          enableElementTags
          enableSearch
          showNavigationButtons
          showNotations
          enableRelationshipDetails
          showDiagramTitle={false}
          renderIcon={IconRenderer}
          onNavigateTo={(_to, event) => {
            const to = _to as scalar.ViewId
            setLastClickedNode()
            extensionApi.locate({ view: to })
            extensionApi.navigateTo(to)
            changeViewId(to)
            event?.stopPropagation()
          }}
          onNodeContextMenu={(element) => {
            setLastClickedNode(element)
          }}
          onCanvasContextMenu={event => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onEdgeContextMenu={(edge, event) => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onChange={({ change }) => {
            extensionApi.change(view.id, change)
          }}
          onOpenSource={(params) => {
            setLastClickedNode()
            extensionApi.locate(params)
          }}
        />
      </div>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
