import Mali, { Context } from 'mali'
import grpc from '@grpc/grpc-js'


function unimplemented(ctx: Context<unknown>) {
  const err = new Error(`method ${ctx.name} not implemented`) as any
  err.code = grpc.status.UNIMPLEMENTED
  err.metadata = new grpc.Metadata()
  throw err
}

async function SetRtCvLocation(ctx: Context<unknown>) {
  unimplemented(ctx)
}

async function CheckCredentials(ctx: Context<unknown>) {
  unimplemented(ctx)
}

function main() {
  const location = '0.0.0.0:50051'

  const app = new Mali('../../server.proto')
  app.use({ SetRtCvLocation, CheckCredentials })

  app.start('0.0.0.0:50051')
  console.log('starting server on', location)
}

main()
