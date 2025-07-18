import { extractStep, isStepEdgeId } from '@likec4/core'
import type { DiagramEdge } from '@likec4/core/types'
import { cx } from '@likec4/styles/css'
import { type BoxProps, Box } from '@likec4/styles/jsx'
import { Text } from '@mantine/core'
import { type PropsWithChildren, forwardRef } from 'react'
import { isTruthy } from 'remeda'
import type { UndefinedOnPartialDeep } from 'type-fest'
import type { EdgeProps } from '../../types'
import { labelsva } from './EdgeLabel.css'

type Data = UndefinedOnPartialDeep<
  Pick<
    DiagramEdge,
    | 'label'
    | 'technology'
  >
>

type EdgeLabelProps = PropsWithChildren<
  BoxProps & {
    edgeProps: EdgeProps<Data>
  }
>

export const EdgeLabel = forwardRef<HTMLDivElement, EdgeLabelProps>((
  {
    edgeProps: {
      id,
      data: {
        label,
        technology,
      },
    },
    className,
    style,
    children,
    ...rest
  },
  ref,
) => {
  const stepNum = isStepEdgeId(id) ? extractStep(id) : null
  const classes = labelsva({
    isStepEdge: stepNum !== null,
  })

  return (
    <Box ref={ref} className={cx(classes.root!, className)} {...rest}>
      {stepNum !== null && (
        <Box className={classes.stepNumber!}>
          {stepNum}
        </Box>
      )}
      <Box className={classes.labelContents!}>
        {isTruthy(label) && (
          <Text component="div" className={classes.labelText!} lineClamp={5}>
            {label}
          </Text>
        )}
        {isTruthy(technology) && (
          <Text component="div" className={classes.labelTechnology!}>
            {'[ ' + technology + ' ]'}
          </Text>
        )}
        {children}
      </Box>
    </Box>
  )
})
EdgeLabel.displayName = 'EdgeLabel'
