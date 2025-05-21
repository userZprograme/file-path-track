// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
// 日志文件路径
// 增加路径标准化处理
//工作路径
const LOG_DIR = path.normalize(path.join('.vscode', 'file_path_changes.log'));
const RENAME_LOG = path.normalize(path.join('.vscode', 'rename_updates.log')); ;


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "file-path-track" is now active!');

	const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {return;}
	//@audit-info 智能补全 
	const index=workspaceFolders[0].uri.fsPath;

	 const logUri = vscode.Uri.file(path.join(index, LOG_DIR));

  const renameLogUri = vscode.Uri.file(path.join(index, RENAME_LOG));
	
	initLogFile([logUri,renameLogUri]);

	// 注册监听器
  const watchers = [
    vscode.workspace.onDidCreateFiles(e => handleEvent('add', e.files, [logUri,renameLogUri])),
    vscode.workspace.onDidDeleteFiles(e => handleEvent('delete', e.files, [logUri,renameLogUri])),
    vscode.workspace.onDidRenameFiles(e => handleRenameEvent(e, [logUri,renameLogUri])),
    //@audit-issue maybe problem
    //删除，重命名
   // vscode.workspace.onDidDeleteFiles(e => handleEvent('delete', e.files, renameLogUri)),
   // vscode.workspace.onDidRenameFiles(e => handleRenameEvent(e, renameLogUri)),

  ];

  // 注册命令和清理回调
  context.subscriptions.push(
    ...watchers,
    vscode.commands.registerCommand('filePathTracker.showLog', () => {
      vscode.window.showTextDocument(logUri);
      vscode.window.showTextDocument(renameLogUri);
    })
  );


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('file-path-track.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from file-path-track!');
	});

	context.subscriptions.push(disposable);
}

function initLogFile(logUris: vscode.Uri[]) {
  //create dir .vscode???
  if (!fs.existsSync(path.dirname(logUris[0].fsPath))) {
    fs.mkdirSync(path.dirname(logUris[0].fsPath));
  }
  if (!fs.existsSync(path.dirname(logUris[1].fsPath))) {
    fs.mkdirSync(path.dirname(logUris[1].fsPath));
  }
  if (!fs.existsSync(logUris[0].fsPath)) {
    fs.writeFileSync(logUris[0].fsPath, '');
  }
   if (!fs.existsSync(logUris[1].fsPath)) {
    fs.writeFileSync(logUris[1].fsPath, '');
  }
}

// 处理新增/删除事件 
function handleEvent(
  type: 'add' | 'delete',
  files: readonly vscode.Uri[],
  logUris: vscode.Uri[]
) {
  files.forEach(uri => {
    const entry = type === 'add' 
      ? formatLogEntry(type, null, uri.fsPath)
      : formatLogEntry(type, uri.fsPath, null);
      type === 'add' 
      ? appendLog(logUris[0], entry)
      :logUris.filter(Boolean).map(uri =>{appendLog(uri, entry);}); 
      
    //
  });
}

// 处理重命名/移动事件
function handleRenameEvent(event: vscode.FileRenameEvent, logUris: vscode.Uri[]) {
  event.files.forEach(({ oldUri, newUri }) => {
    const entry = formatLogEntry('update', oldUri.fsPath, newUri.fsPath);
    for(const uri of logUris){
    appendLog(uri, entry);
    }
  });
}
// 格式化日志条目
function formatLogEntry(
  action: string,
  oldPath: string | null,
  newPath: string | null
): string {
  return [
    `action:${action}`,
    `path:${oldPath || 'null'}`,
    `pathed:${newPath || 'null'}`,
    `time:${new Date().toISOString()}`
  ].join(',') + '\n';
}

// 追加日志
function appendLog(logUri: vscode.Uri, content: string) {
  fs.appendFile(logUri.fsPath, content, (err) => {
    if (err) {
      vscode.window.showErrorMessage('日志写入失败: ' + err.message);
    }
  });

}

// This method is called when your extension is deactivated
export function deactivate() {}