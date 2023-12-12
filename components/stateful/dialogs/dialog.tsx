import * as Root from "@/components/ui/dialog"
import { useDialogStore } from "@/stores/dialog.store"
import { Button } from "@components/ui/button"
import { Heading } from "./heading"
import {
  descriptionClasses,
  footerClasses,
  getContentClasses,
  titleClasses,
} from "./styles"

// TODO: handle all types "Warning" "Info"
export function Dialog() {
  const { opened, setOpened, title, children, actionButtons, type } =
    useDialogStore()
  return (
    <Root.Dialog open={opened} onOpenChange={setOpened}>
      <div className="w-full h-full relative">
        <Root.DialogContent className={getContentClasses(type)}>
          <Root.DialogHeader>
            <Heading type={type} />
            <Root.DialogTitle className={titleClasses}>
              {title}
            </Root.DialogTitle>
            <Root.DialogDescription className={descriptionClasses}>
              {children}
            </Root.DialogDescription>
          </Root.DialogHeader>
          <Root.DialogFooter className={footerClasses}>
            {actionButtons?.map(({ id, ...props }) => {
              return <Button key={id} size={"lg"} aria-label={id} {...props} />
            })}
          </Root.DialogFooter>
        </Root.DialogContent>
      </div>
    </Root.Dialog>
  )
}
