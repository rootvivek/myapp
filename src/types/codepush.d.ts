declare module 'react-native-code-push' {
  interface CodePushUpdate {
    label: string;
    packageSize: number;
    isMandatory: boolean;
    failedInstall: boolean;
    downloadUrl: string;
    downloadProgress?: (progress: { totalBytes: number; receivedBytes: number }) => void;
  }

  interface SyncOptions {
    deploymentKey?: string;
    updateDialog?: {
      appendReleaseDescription?: boolean;
      descriptionPrefix?: string;
      mandatoryUpdateMessage?: string;
      optionalUpdateMessage?: string;
      title?: string;
    };
    installMode?: InstallMode;
    minimumBackgroundDuration?: number;
    mandatoryInstallMode?: InstallMode;
  }

  enum InstallMode {
    IMMEDIATE = 'IMMEDIATE',
    ON_NEXT_RESTART = 'ON_NEXT_RESTART',
    ON_NEXT_RESUME = 'ON_NEXT_RESUME',
  }

  enum SyncStatus {
    UP_TO_DATE = 'UP_TO_DATE',
    UPDATE_INSTALLED = 'UPDATE_INSTALLED',
    UPDATE_IGNORED = 'UPDATE_IGNORED',
    ERROR = 'ERROR',
    IN_PROGRESS = 'IN_PROGRESS',
    CHECKING_FOR_UPDATE = 'CHECKING_FOR_UPDATE',
    DOWNLOADING_PACKAGE = 'DOWNLOADING_PACKAGE',
    INSTALLING_UPDATE = 'INSTALLING_UPDATE',
  }

  interface SyncStatusCallback {
    (status: SyncStatus): void;
  }

  interface DownloadProgressCallback {
    (progress: { totalBytes: number; receivedBytes: number }): void;
  }

  const CodePush: {
    checkForUpdate(deploymentKey?: string): Promise<CodePushUpdate | null>;
    sync(options?: SyncOptions): Promise<SyncStatus>;
    notifyAppReady(): void;
    getCurrentPackage(): Promise<CodePushUpdate | null>;
    getUpdateMetadata(): Promise<CodePushUpdate | null>;
    InstallMode: typeof InstallMode;
    SyncStatus: typeof SyncStatus;
  };

  export default CodePush;
  export { CodePush, CodePushUpdate, SyncOptions, InstallMode, SyncStatus };
}