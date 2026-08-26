import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextInput, type TextInputProps } from "./TextInput";

export type PasswordInputProps = Omit<TextInputProps, "suffix" | "type">;

/**
 * `TextInput` preset that toggles between `type="password"` and
 * `type="text"` via a trailing icon button. The toggle button is a real
 * `<button>` with an `aria-label` that flips with the state ("Show
 * password" / "Hide password"), not an icon-only decoration.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <TextInput
        ref={ref}
        type={visible ? "text" : "password"}
        suffix={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="text-text-secondary hover:text-text-primary"
          >
            {visible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);
PasswordInput.displayName = "PasswordInput";
