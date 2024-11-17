import type { GithubNode, GithubTree } from '$lib/server/github/schema';
import { TRPCError } from '@trpc/server';

export enum InitFileNames {
  initLua = 'init.lua',
  initVim = 'init.vim',
  initFnl = 'init.fnl',
  vimRC = '.vimrc'
}

export interface InitFile {
  path: string;
  type: InitFileNames;
  root: string;
}

export class InitFileFinder {
  excluded = ['ginit.vim'];
  // @TODO: fix maybe later
  // fail this
  // init.lua
  //    /codico
  //        /lua
  //            init.lua
  //
  // allow this
  //    /astro-nvim
  //        /lua
  //            init.lua

  findAllInitFile(root: GithubTree): InitFile[] {
    const { tree } = root;
    const initLuas = this._findInitFiles(tree, InitFileNames.initLua);
    const initFnl = this._findInitFiles(tree, InitFileNames.initFnl);
    const initVims = this._findInitFiles(tree, InitFileNames.initVim);
    const vimRCs = this._findInitFiles(tree, InitFileNames.vimRC);
    const paths = [...initLuas, ...initFnl, ...initVims, ...vimRCs];
    if (!paths.length) {
      throw new TRPCError({ message: 'failed to identify init file', code: 'BAD_REQUEST' });
    }
    return paths.map((p) => this.parseReturn(p));
  }

  parseReturn(path: string): InitFile {
    const roots = path.split('/');
    const type = roots.pop() as InitFileNames;
    return {
      root: roots.join('/'),
      path,
      type
    };
  }

  private _findInitFiles(tree: GithubNode[], fileName: string): string[] {
    const files = tree
      .filter((n) => n.path?.endsWith(fileName))
      .filter((n) => {
        for (const excluded of this.excluded) {
          if (n.path?.includes(excluded)) return false;
        }
        return true;
      })
      .map((n) => n.path)
      .filter(Boolean);
    return files as string[];
  }
}
