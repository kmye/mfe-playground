declare module "remote_one/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}

declare module "remote_two/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}

declare module "remote_vue/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}

declare module "remote_svelte/export-app" {
  const module: {
    default: () => {
      render(info: { dom: HTMLElement; basename?: string }): Promise<void>;
      destroy(info: { dom: HTMLElement }): void;
    };
  };
  export default module;
}
