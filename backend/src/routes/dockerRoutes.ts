import { Elysia, t } from 'elysia';
import { 
  createChatInstance, 
} from '../services/dockerService';

export const dockerRoutes = new Elysia({ prefix: '/docker' })
  // ตรวจสอบการเชื่อมต่อ Docker
  // .get('/ping', async ({ set }) => {
  //   const isConnected = await checkDockerConnection();
    
  //   if (!isConnected) {
  //     set.status = 503;
  //     return { 
  //       error: 'Cannot connect to Docker',
  //       message: 'Please make sure Docker Desktop is running'
  //     };
  //   }
    
  //   return { message: 'Docker connection successful' };
  // })

  // สร้าง Container ใหม่
  .post('/create', async ({ body, set }) => {
    try {
      const result = await createChatInstance(body.modelName);
      
      set.status = 201;
      return {
        success: true,
        data: result,
        message: `Model ${body.modelName} deployed successfully`
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create container'
      };
    }
  }, {
    body: t.Object({
      modelName: t.String({ 
        default: 'qwen:0.5b',
        description: 'Model name to deploy (e.g., qwen:0.5b, llama2, mistral)'
      })
    })
  })

  // หยุดและลบ Container
  // .delete('/:containerId', async ({ params, set }) => {
  //   try {
  //     await stopAndRemoveContainer(params.containerId);
  //     return {
  //       success: true,
  //       message: `Container ${params.containerId} removed successfully`
  //     };
  //   } catch (error) {
  //     set.status = 500;
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Failed to remove container'
  //     };
  //   }
  // }, {
  //   params: t.Object({
  //     containerId: t.String()
  //   })
  // })

  // // ดึงรายการ Container ทั้งหมด
  // .get('/list', async ({ set }) => {
  //   try {
  //     const containers = await listContainers();
      
  //     return {
  //       success: true,
  //       data: containers.map(c => ({
  //         id: c.Id,
  //         name: c.Names[0],
  //         image: c.Image,
  //         state: c.State,
  //         status: c.Status,
  //         ports: c.Ports
  //       }))
  //     };
  //   } catch (error) {
  //     set.status = 500;
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Failed to list containers'
  //     };
  //   }
  // });